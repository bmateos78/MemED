# Publishing MemED to AWS EC2

This guide provides step-by-step instructions to host the MemED application on an AWS EC2 instance using the AWS CLI.

## Prerequisites
- AWS CLI installed and configured (`aws configure`).
- You are in the root directory of the project in your terminal.

## Step 1: Create a Key Pair
This will create a `.pem` file to allow you to connect to your instance via SSH.

```bash
aws ec2 create-key-pair --key-name memed-key --query 'KeyMaterial' --output text > memed-key.pem
chmod 400 memed-key.pem
```

## Step 2: Create a Security Group
This sets up the firewall to allow web traffic (Port 80) and SSH access (Port 22).

```bash
# Create the group and save the ID
SG_ID=$(aws ec2 create-security-group --group-name memed-sg --description "SG for MemED Web Server" --query 'GroupId' --output text)
echo "Security Group ID: $SG_ID"

# Allow HTTP (80) from anywhere
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow SSH (22) from your IP
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
```

## Step 3: Launch the EC2 Instance
We will use an Amazon Linux 2023 AMI. This command installs Nginx and configures it with a robust **Full Reverse Proxy** to avoid CORS issues.

**For eu-central-1 (Frankfurt):** Use AMI `ami-09e939ec71a36e537`.

```bash
# Launch a t2.micro instance (Free Tier eligible)
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-09e939ec71a36e537 \
    --count 1 \
    --instance-type t2.micro \
    --key-name memed-key \
    --security-group-ids $SG_ID \
    --user-data "#!/bin/bash
dnf update -y
dnf install -y nginx

# Create a robust full Nginx configuration
cat <<EOF > /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    # Extended timeouts for LLM APIs (300 seconds)
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    server {
        listen 80 default_server;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files \$uri \$uri/ =404;
        }

        # Proxy for OpenAI
        location /api/openai/ {
            proxy_pass https://api.openai.com/;
            proxy_set_header Host api.openai.com;
            proxy_ssl_server_name on;
        }

        # Proxy for Anthropic
        location /api/anthropic/ {
            proxy_pass https://api.anthropic.com/;
            proxy_set_header Host api.anthropic.com;
            proxy_ssl_server_name on;
        }

        # Proxy for Google Gemini
        location /api/google/ {
            proxy_pass https://generativelanguage.googleapis.com/;
            proxy_set_header Host generativelanguage.googleapis.com;
            proxy_ssl_server_name on;
        }
    }
}
EOF

systemctl start nginx
systemctl enable nginx
chown -R ec2-user:ec2-user /usr/share/nginx/html" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Instance ID: $INSTANCE_ID"
```

## Step 4: Get Public IP Address
Wait about 60 seconds for the instance to initialize, then run:

```bash
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "Your application will be available at: http://$PUBLIC_IP"
```

## Step 5: Upload Project Files
Sync your project files to the instance.

```bash
# Upload files to the Nginx root directory
scp -i memed-key.pem -r ./* ec2-user@$PUBLIC_IP:/usr/share/nginx/html/
```

## Step 6: Access your App
Open your browser and navigate to `http://$PUBLIC_IP`.

---
## Maintenance & Updates
To update the files later, simply run the `scp` command again from Step 5.

## Clean Up (To avoid costs)
When you are finished and want to delete everything:
```bash
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
aws ec2 delete-security-group --group-id $SG_ID
aws ec2 delete-key-pair --key-name memed-key
rm memed-key.pem
```

---
title: 'EC2 - Your First Virtual Server'
description: 'Launch your first virtual server in the cloud and understand how cloud computing replaces traditional hosting.'
order: 3
---

Think of EC2 (Elastic Compute Cloud) as renting a computer in Amazon's data center instead of buying one for your office. You get a virtual server that looks and acts like a real computer, but it exists in the cloud where Amazon handles all the physical maintenance.

## Why Use Virtual Servers?

Traditional web hosting comes with significant challenges. You typically need to buy expensive hardware upfront, which means guessing how much capacity you'll need months or years in advance. When hardware fails, you're responsible for fixing or replacing it yourself, often resulting in hours or days of downtime. Perhaps most frustrating of all, you're paying for servers 24/7 even when they're sitting idle.

Cloud servers solve these problems elegantly. You can start with small, inexpensive servers and grow them as your needs change. You only pay for what you actually use, which means no more paying for idle capacity during quiet periods. When hardware fails, AWS handles the replacement automatically, often without you even noticing. Most importantly, you can scale your capacity up during busy periods and back down when things are quiet, optimizing both performance and cost.

## Understanding Instance Types

AWS offers different "flavors" of virtual servers called instance types. Think of them like different models of cars - some are economical, others are high-performance.

For learning, you'll use **t3.micro** instances because they're:

- Free for your first year
- Perfect for small websites and testing
- Easy to upgrade later if needed

As your applications grow, you might need:

- **t3.small** for slightly more power
- **m5.large** for balanced performance
- **c5.xlarge** for processing-heavy tasks

The naming might seem confusing at first, but you'll get used to it. For now, just remember that "micro" and "small" are perfect for learning.

## Launching Your First Server

Let's create your first virtual server. We'll build a simple web server that displays a welcome message.

In the AWS Console, navigate to EC2 and click "Launch Instance." You'll see several options:

### Choose Your Operating System

AWS offers pre-built server images called AMIs (Amazon Machine Images). For this guide, select **Amazon Linux 2** because it:

- Comes with useful tools pre-installed
- Gets regular security updates from Amazon
- Works well with other AWS services
- Is free to use

### Pick Your Server Size

Select **t3.micro** - it's marked as "Free tier eligible" which means it won't cost you anything during your first year.

### Configure the Basics

Most default settings work fine for learning, but pay attention to:

**Key Pairs**: This is how you'll securely connect to your server. Create a new key pair and download the file - you'll need it later. Think of this like a special password file.

**Security Groups**: These act like a firewall for your server. For now, allow:

- SSH (port 22) from your IP address for remote access
- HTTP (port 80) from anywhere for web traffic

### Add Some Startup Code

In the "User Data" section, you can tell your server to run commands when it first starts. Add this simple script:

```bash
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
echo "<h1>Hello from the Cloud!</h1>" > /var/www/html/index.html
```

This tells your server to:

1. Update its software
2. Install a web server
3. Start the web server
4. Create a simple webpage

## Connecting to Your Server

Once your server is running (it takes a few minutes), you can connect to it from your computer.

**On Mac or Linux:**

```bash
ssh -i your-key-file.pem ec2-user@your-server-ip
```

**On Windows:**
Use PuTTY or the Windows Subsystem for Linux with the same command.

Replace "your-server-ip" with the actual IP address shown in the EC2 console.

## Testing Your Web Server

Open a web browser and visit your server's public IP address. You should see "Hello from the Cloud!" displayed on the page.

Congratulations! You've just created your first cloud server and published a website.

## Understanding the Console

The EC2 console shows important information about your server:

**Instance State**: Shows if your server is running, stopped, or being launched
**Public IP**: The address people use to reach your server from the internet
**Private IP**: The address used within AWS's network
**Instance ID**: A unique identifier for your server (starts with "i-")

## Server Management Basics

Unlike a physical server, you can easily:

**Stop and Start**: Like turning a computer off and on, but you keep your data
**Terminate**: Permanently delete the server (be careful with this!)
**Resize**: Change to a more powerful instance type
**Create Images**: Save a snapshot of your server to reuse later

## The Magic of Elastic IPs

By default, your server gets a different IP address each time you stop and start it. For a real website, you want a permanent address.

Elastic IP addresses solve this by giving you a static IP that stays with your server. They're free as long as they're attached to a running server.

## What This Costs

During your first year, t3.micro instances are free for up to 750 hours per month. That's enough to run one server 24/7 without charges.

After the free tier, expect to pay around $8-10 per month for a small server that's always running.

## Common Beginner Mistakes

**Forgetting to stop servers**: Unlike shared hosting, AWS charges for running time. Stop servers when you're not using them.

**Losing key files**: If you lose your key pair file, you can't access your server. Keep it safe!

**Opening security groups too wide**: Only allow access from your IP address unless you need public access.

**Not backing up data**: Servers can fail. Important data should be stored separately (we'll cover this in the storage section).

## Real-World Applications

This simple setup might seem basic, but it's the foundation for:

- Small business websites
- Development and testing environments
- Learning platforms
- Personal projects

Large applications use the same principles but with multiple servers, load balancers, and databases working together.

## Next Steps

Now that you have a server running, you'll want somewhere to store files, images, and backups. That's where S3 (Simple Storage Service) comes in.

S3 is like having unlimited cloud storage that your servers can access instantly. It's perfect for everything from user profile pictures to application backups.

In the next section, you'll learn how to use S3 and connect it to your EC2 server.

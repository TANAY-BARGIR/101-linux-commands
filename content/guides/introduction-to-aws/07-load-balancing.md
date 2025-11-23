---
title: 'Load Balancing and Auto Scaling'
description: 'Handle traffic spikes gracefully by distributing load and automatically adjusting capacity.'
order: 7
---

Imagine your website suddenly becomes popular - maybe you're featured on social media or a news site links to your content. Without proper planning, this success could crash your site as thousands of users try to access it simultaneously.

Load balancing and auto scaling solve this problem by automatically spreading traffic across multiple servers and adding more capacity when needed. It's like having a smart traffic management system that opens more lanes during rush hour.

## The Problem with Single Servers

Traditional web hosting often uses one server to handle all traffic:

- **Single point of failure**: If the server crashes, your entire site goes down
- **Limited capacity**: One server can only handle so many users
- **Wasted resources**: During quiet periods, you're paying for unused capacity
- **No flexibility**: Can't easily add more power during busy times

## How Load Balancing Solves This

A load balancer acts like a smart receptionist at a busy restaurant:

- **Distributes customers**: Sends each visitor to the least busy server
- **Health checking**: Knows which servers are working and which aren't
- **Seamless experience**: Users don't know they're being directed to different servers
- **Handles failures**: If one server fails, traffic automatically goes to healthy ones

## Understanding Auto Scaling

Auto scaling is like having a magical restaurant that can instantly add or remove tables based on crowd size:

- **Scale out**: Add more servers when traffic increases
- **Scale in**: Remove servers when traffic decreases
- **Cost optimization**: Only pay for what you need at any given moment
- **Automatic**: No manual intervention required

## Types of Load Balancers

AWS offers three types of load balancers for different needs:

### Application Load Balancer (ALB)

- **Best for**: Web applications, HTTP/HTTPS traffic
- **Features**: Smart routing based on URLs, host names, or headers
- **Example**: Send `/api/*` requests to API servers, everything else to web servers

### Network Load Balancer (NLB)

- **Best for**: High-performance applications, TCP/UDP traffic
- **Features**: Ultra-low latency, handles millions of requests per second
- **Example**: Gaming servers, IoT applications

### Classic Load Balancer

- **Best for**: Legacy applications (not recommended for new projects)
- **Features**: Basic load balancing
- **Note**: Being phased out in favor of ALB and NLB

For web applications, Application Load Balancer is almost always the right choice.

## Creating Your First Load Balancer

Let's set up a load balancer for a web application that can handle traffic spikes gracefully.

### Planning Your Setup

Before creating anything, think about:

- **How many servers do you need normally**: Start with 2 for redundancy
- **What's your peak traffic**: How many servers during busy periods
- **Where are your users**: Single region or global
- **What type of traffic**: Web pages, API calls, file downloads

### Load Balancer Configuration

**Type**: Application Load Balancer
**Scheme**: Internet-facing (users can reach it from the web)
**Subnets**: Place in public subnets across multiple availability zones
**Security**: Allow HTTP (port 80) and HTTPS (port 443) from anywhere

### Target Groups

Target groups define which servers receive traffic:

- **Name**: web-servers-target-group
- **Protocol**: HTTP on port 80
- **Health check**: Check `/health` endpoint every 30 seconds
- **Healthy threshold**: 2 consecutive successful checks
- **Unhealthy threshold**: 5 consecutive failed checks

## Understanding Health Checks

Health checks are like a doctor regularly checking patients - they ensure only healthy servers receive traffic.

### What Makes a Server Healthy?

A good health check verifies:

- **Web server is running**: Can respond to HTTP requests
- **Application is working**: Not just the web server, but your actual application
- **Database connection**: Can the application talk to the database
- **Critical dependencies**: Any external services your application needs

### Example Health Check Endpoint

```javascript
// Simple health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await database.query('SELECT 1');

    // Check critical services
    const checks = {
      database: 'healthy',
      timestamp: new Date().toISOString(),
      server: process.env.SERVER_ID,
    };

    res.status(200).json(checks);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

## Setting Up Auto Scaling

Auto Scaling Groups (ASG) manage collections of EC2 instances automatically:

### Key Configuration Options

**Minimum Size**: Always keep at least this many servers running
**Maximum Size**: Never exceed this many servers (cost protection)
**Desired Capacity**: How many servers you want running normally
**Scaling Policies**: Rules for when to add or remove servers

### Example Configuration

For a small web application:

- **Minimum**: 2 servers (for redundancy)
- **Maximum**: 10 servers (cost protection)
- **Desired**: 2 servers (normal operation)

This setup ensures you always have redundancy but won't accidentally create expensive resources.

## Scaling Policies: When to Add or Remove Servers

### CPU-Based Scaling

Most common approach - scale based on server CPU usage:

- **Scale out**: Add servers when average CPU > 70% for 5 minutes
- **Scale in**: Remove servers when average CPU < 30% for 10 minutes

### Request-Based Scaling

Scale based on incoming traffic:

- **Scale out**: Add servers when requests per server > 1000/minute
- **Scale in**: Remove servers when requests per server < 200/minute

### Scheduled Scaling

If you know when traffic spikes occur:

- **Business hours**: Scale up at 8 AM, scale down at 6 PM
- **Seasonal**: Add capacity during holiday shopping season
- **Events**: Scale up before product launches or marketing campaigns

## Launch Templates: Blueprints for New Servers

When auto scaling adds servers, it needs to know how to configure them. Launch templates are like recipes that specify:

### Server Configuration

**Instance Type**: What size server to create
**Security Groups**: Which firewall rules to apply
**IAM Role**: What permissions the server should have
**Key Pair**: How to access the server for troubleshooting

### Application Setup

**User Data Script**: Commands to run when the server first starts
**Application Installation**: Download and install your application
**Configuration**: Connect to database, set environment variables
**Service Startup**: Start your web server and application

### Example User Data Script

```bash
#!/bin/bash
# Update the system
yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install your application
cd /home/ec2-user
# Your application setup commands here
npm install
npm start
```

## Integrating Load Balancer with Auto Scaling

The magic happens when load balancers and auto scaling work together:

1. **Traffic increases**: More users visit your website
2. **Servers get busy**: CPU usage rises across your servers
3. **Auto scaling triggers**: Adds new servers based on your scaling policy
4. **Load balancer adapts**: Automatically starts sending traffic to new servers
5. **Traffic distributes**: Load spreads across all healthy servers

When traffic decreases, the process reverses automatically.

## SSL/TLS Certificates for HTTPS

Modern websites need HTTPS for security and SEO. AWS makes this easy:

### AWS Certificate Manager

Free SSL certificates for use with load balancers:

- **Automatic renewal**: Never worry about expired certificates
- **Easy installation**: Attach to load balancer with a few clicks
- **Domain validation**: Prove you own the domain

### Setting Up HTTPS

1. **Request certificate**: Use Certificate Manager to request a certificate for your domain
2. **Validate domain**: Prove ownership through DNS or email
3. **Attach to load balancer**: Configure HTTPS listener with your certificate
4. **Redirect HTTP to HTTPS**: Force all traffic to use secure connections

## Path-Based Routing

Advanced load balancers can route traffic based on URL paths:

### Example Routing Rules

**Website Traffic** (`/`): Send to web servers
**API Traffic** (`/api/*`): Send to API servers
**Admin Panel** (`/admin/*`): Send to admin servers
**Static Files** (`/static/*`): Send to file servers

This lets you optimize different parts of your application independently.

## Monitoring Your Scaled Application

Keep track of how your application performs under load:

### Key Metrics to Watch

**Request Count**: How many requests your application handles
**Response Time**: How fast your application responds
**Error Rate**: Percentage of requests that fail
**Server Count**: How many servers are running
**CPU Utilization**: How hard your servers are working

### Setting Up Alerts

Get notified when things need attention:

- **High error rate**: Alert when more than 1% of requests fail
- **Slow response time**: Alert when average response time exceeds 2 seconds
- **Scaling events**: Get notified when servers are added or removed
- **Health check failures**: Immediate alert when servers become unhealthy

## Cost Optimization Strategies

Scaling can save money, but poor configuration can increase costs:

### Best Practices for Cost Control

**Right-size instances**: Use the smallest instance type that meets your performance needs
**Aggressive scale-in**: Remove servers quickly when traffic decreases
**Scheduled scaling**: Scale down during predictable quiet periods
**Spot instances**: Use discounted capacity for non-critical workloads

### Cost Monitoring

**Set up billing alerts**: Get notified when costs exceed expectations
**Track scaling events**: Understand what triggers scaling
**Review utilization**: Make sure scaled instances are actually needed
**Regular optimization**: Adjust scaling policies based on actual usage patterns

## Common Scaling Patterns

### Web Application Pattern

**Architecture**: Load balancer → Multiple web servers → Database
**Scaling**: Scale web servers based on CPU or request count
**Database**: Use read replicas to scale database reads
**Sessions**: Store session data in shared location (not on individual servers)

### API Service Pattern

**Architecture**: Load balancer → API servers → Database
**Scaling**: Scale based on request rate and response time
**Caching**: Use Redis or Memcached to reduce database load
**Rate limiting**: Protect against abuse and sudden spikes

### Microservices Pattern

**Architecture**: Multiple load balancers for different services
**Scaling**: Each service scales independently
**Service discovery**: Services find each other dynamically
**Complexity**: More complex but more flexible

## Handling Sessions and State

When you have multiple servers, you need to handle user sessions carefully:

### Stateless Applications (Recommended)

Design applications so any server can handle any request:

- **Store session data externally**: Database, Redis, or DynamoDB
- **Use tokens**: JWT tokens contain user information
- **Avoid server-side state**: Don't store user data in server memory

### Sticky Sessions (Not Recommended)

Force users to always go to the same server:

- **Pros**: Simpler application design
- **Cons**: Reduces load balancer effectiveness, complicates scaling

## Disaster Recovery and Multi-Region

For maximum reliability, consider multi-region deployments:

### Multi-AZ vs. Multi-Region

**Multi-AZ**: Multiple data centers in the same geographic region

- **Protects against**: Single data center failures
- **Latency**: Very low between zones
- **Cost**: Minimal additional cost

**Multi-Region**: Resources in completely different geographic areas

- **Protects against**: Regional disasters, compliance requirements
- **Latency**: Higher between regions
- **Cost**: Significantly higher due to data replication

## Testing Your Scaled Application

Before relying on auto scaling in production, test it thoroughly:

### Load Testing

Simulate high traffic to verify scaling works:

- **Gradual increase**: Slowly increase load to trigger scaling
- **Sudden spikes**: Test how quickly scaling responds to traffic bursts
- **Sustained load**: Verify system stability under extended high load

### Failure Testing

Test how your system handles server failures:

- **Server termination**: Terminate servers to test health checks and replacement
- **Partial failures**: Test with some servers healthy and others failing
- **Database failures**: Ensure application handles database connectivity issues

## Common Mistakes to Avoid

### Configuration Mistakes

**Scaling too aggressively**: Adding servers faster than they can start up
**Health checks too strict**: Marking healthy servers as unhealthy
**Security groups**: Not allowing load balancer to talk to servers
**Session stickiness**: Using sticky sessions when not necessary

### Monitoring Mistakes

**Ignoring metrics**: Not watching how scaling performs in practice
**Alert fatigue**: Too many alerts that get ignored
**No cost monitoring**: Scaling costs getting out of control
**Insufficient testing**: Assuming scaling will work without testing

## Next Steps

With your application now able to handle traffic automatically, you need visibility into how it's performing. CloudWatch monitoring gives you the insights needed to optimize performance, detect issues early, and understand user behavior.

Monitoring is especially important for scaled applications because issues can multiply across multiple servers, and you need to distinguish between normal scaling events and actual problems.

In the next section, you'll learn to set up comprehensive monitoring that gives you confidence in your scaled application's health and performance.

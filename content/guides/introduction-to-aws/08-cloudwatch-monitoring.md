---
title: 'CloudWatch - Monitoring Your Applications'
description: 'Keep your applications healthy with monitoring, alerts, and insights into performance and usage.'
order: 8
---

Running applications without monitoring is like driving a car without a dashboard - you might be fine for a while, but when problems occur, you won't know until it's too late. CloudWatch is AWS's monitoring service that gives you visibility into everything happening in your cloud infrastructure.

Think of CloudWatch as your application's health monitoring system, like a fitness tracker for your website that tracks vital signs and alerts you when something's wrong.

## Why Monitoring Matters

Without proper monitoring, you might discover problems when:

- Users complain about slow performance
- Your website crashes during peak traffic
- You receive an unexpectedly high AWS bill
- Security issues go undetected for weeks

With good monitoring, you can:

- **Detect issues before users notice them**
- **Understand usage patterns** to optimize costs and performance
- **Respond quickly** to problems with detailed information
- **Make data-driven decisions** about scaling and optimization

## Understanding CloudWatch Components

CloudWatch has several parts that work together:

### Metrics

Numerical measurements over time, like:

- **CPU usage**: How hard your servers are working
- **Network traffic**: How much data is being transferred
- **Request count**: How many people are using your application
- **Error rates**: How often things go wrong

### Logs

Text-based records of what's happening in your applications:

- **Application logs**: What your code is doing
- **Web server logs**: Which pages users visit
- **System logs**: Operating system events
- **Database logs**: Query performance and errors

### Alarms

Notifications triggered when metrics cross thresholds:

- **Email alerts**: Get notified of issues immediately
- **SMS notifications**: Critical alerts sent to your phone
- **Automated actions**: Automatically scale or restart services

### Dashboards

Visual displays of your system's health:

- **Real-time graphs**: See current performance at a glance
- **Historical trends**: Understand patterns over time
- **Custom views**: Focus on metrics that matter to you

## Metrics That AWS Collects Automatically

Most AWS services automatically send metrics to CloudWatch:

### EC2 Instance Metrics

- **CPUUtilization**: Percentage of CPU being used
- **NetworkIn/NetworkOut**: Data transfer amounts
- **DiskReadOps/DiskWriteOps**: Storage activity
- **StatusCheckFailed**: Whether instance is healthy

### Load Balancer Metrics

- **RequestCount**: Total number of requests
- **TargetResponseTime**: How long responses take
- **HTTPCode_Target_2XX_Count**: Successful requests
- **HTTPCode_Target_5XX_Count**: Server error requests

### RDS Database Metrics

- **CPUUtilization**: Database server CPU usage
- **DatabaseConnections**: Number of active connections
- **ReadLatency/WriteLatency**: Database response times
- **FreeStorageSpace**: Available disk space

### S3 Storage Metrics

- **BucketSizeBytes**: How much data you're storing
- **NumberOfObjects**: Count of files in buckets
- **AllRequests**: Total requests to your buckets

## Custom Application Metrics

Beyond AWS service metrics, you should track metrics specific to your application:

### Business Metrics

- **User registrations**: How many people sign up
- **Order completions**: E-commerce transaction success
- **Page views**: Which content is popular
- **Feature usage**: Which parts of your app get used most

### Performance Metrics

- **Response times**: How fast your application responds
- **Error rates**: Percentage of requests that fail
- **Database query times**: How long database operations take
- **Queue lengths**: How many tasks are waiting to be processed

### Example: Adding Custom Metrics to Your Application

```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

// Function to send metrics to CloudWatch
async function recordMetric(metricName, value, unit = 'Count') {
  try {
    await cloudwatch
      .putMetricData({
        Namespace: 'MyApp/Custom',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
          },
        ],
      })
      .promise();
  } catch (error) {
    console.error('Failed to send metric:', error);
  }
}

// Record business metrics
app.post('/users/register', async (req, res) => {
  try {
    await createUser(req.body);
    await recordMetric('UserRegistrations', 1);
    res.json({ success: true });
  } catch (error) {
    await recordMetric('RegistrationErrors', 1);
    res.status(500).json({ error: error.message });
  }
});
```

## Setting Up Your First CloudWatch Alarm

Alarms notify you when metrics indicate problems. Let's create an alarm for high CPU usage:

### Planning Your Alarm

**What to monitor**: EC2 instance CPU utilization
**Threshold**: Alert when CPU exceeds 80%
**Duration**: Only alert if high for 5+ minutes (avoid false alarms)
**Action**: Send email notification

### Alarm Configuration

**Metric**: AWS/EC2 CPUUtilization
**Statistic**: Average (over 5-minute periods)
**Threshold**: Greater than 80%
**Evaluation periods**: 2 (must be high for 10 minutes total)
**Missing data**: Treat as not breaching (assume healthy)

### Notification Setup

Create an SNS (Simple Notification Service) topic to handle notifications:

- **Topic name**: critical-alerts
- **Subscribers**: Your email address
- **Confirmation**: Check your email and confirm the subscription

## CloudWatch Logs for Application Monitoring

Logs provide detailed information about what's happening in your applications:

### Types of Logs to Collect

**Application Logs**: Your application's output

```javascript
console.log('User logged in:', { userId: 123, timestamp: new Date() });
console.error('Database connection failed:', error.message);
```

**Web Server Logs**: HTTP requests and responses

```
127.0.0.1 - - [28/May/2025:10:00:00 +0000] "GET /api/users HTTP/1.1" 200 1234
```

**System Logs**: Operating system events

```
May 28 10:00:00 ip-10-0-1-100 kernel: Out of memory: Kill process 1234
```

### Setting Up Log Collection

Install the CloudWatch agent on your EC2 instances to automatically send logs:

```bash
# Download and install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

Configure the agent to collect your application logs:

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/myapp/application.log",
            "log_group_name": "MyApp/Application",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
```

## Analyzing Logs with CloudWatch Insights

CloudWatch Logs Insights lets you search and analyze your logs:

### Common Log Queries

**Find errors in the last hour**:

```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

**Count requests by status code**:

```
fields @timestamp, status
| filter @timestamp > now() - 1h
| stats count() by status
```

**Find slow database queries**:

```
fields @timestamp, query_time, query
| filter query_time > 1000
| sort query_time desc
```

### Using Insights for Troubleshooting

When users report problems:

1. **Check error logs** around the time of the issue
2. **Look for patterns** in error messages
3. **Correlate with metrics** to understand system state
4. **Track down root causes** using detailed log information

## Creating Useful Dashboards

Dashboards provide at-a-glance views of your system health:

### Essential Dashboard Widgets

**System Health Overview**:

- EC2 CPU utilization across all instances
- Load balancer request count and response time
- Database CPU and connection count
- Error rates across all services

**Application Performance**:

- Custom application metrics (user registrations, orders, etc.)
- Response time percentiles (50th, 95th, 99th)
- Error rates by endpoint or feature
- Queue lengths and processing times

**Infrastructure Costs**:

- Estimated monthly charges
- Resource utilization trends
- Storage usage growth
- Data transfer amounts

### Dashboard Best Practices

**Keep it simple**: Don't overcrowd dashboards with too many metrics
**Use meaningful names**: "Web Server Performance" is better than "Dashboard 1"
**Group related metrics**: Put database metrics together, web server metrics together
**Set appropriate time ranges**: Last 24 hours for operational dashboards, last 30 days for trend analysis

## Monitoring Strategies for Different Scenarios

### Small Application Monitoring

**Focus on basics**:

- Server health (CPU, memory, disk)
- Application errors
- User experience (response times)
- Basic cost monitoring

**Simple alerting**:

- High CPU/memory usage
- Application error spikes
- Service unavailability

### Growing Application Monitoring

**Add detail**:

- Business metric tracking
- Performance by feature/endpoint
- Database performance monitoring
- User behavior analytics

**Enhanced alerting**:

- Custom threshold based on historical data
- Predictive alerting for trending issues
- Integration with team chat tools

### Production Application Monitoring

**Comprehensive coverage**:

- Full-stack monitoring (frontend to database)
- Security event monitoring
- Compliance and audit logging
- Performance optimization insights

**Advanced alerting**:

- Anomaly detection for unusual patterns
- Composite alarms combining multiple metrics
- Automated remediation actions
- Escalation procedures for critical issues

## Cost Management Through Monitoring

CloudWatch itself has costs, but good monitoring can save money overall:

### CloudWatch Costs

**Metrics**: $0.30 per metric per month (first 10 metrics free)
**Logs**: $0.50 per GB ingested, $0.03 per GB stored
**Alarms**: $0.10 per alarm per month (first 10 alarms free)
**Dashboards**: $3.00 per dashboard per month (first 3 dashboards free)

### Cost Optimization Through Monitoring

**Right-sizing resources**: Use CPU and memory metrics to optimize instance sizes
**Auto-scaling efficiency**: Monitor scaling events to tune policies
**Storage optimization**: Track storage usage to implement lifecycle policies
**Unused resource detection**: Identify idle resources that can be terminated

## Security Monitoring

Monitor security-related events to detect potential issues:

### Important Security Metrics

**Failed login attempts**: Unusual authentication patterns
**Unusual API activity**: Unexpected service usage
**Network traffic patterns**: Unusual data transfer amounts
**Access pattern changes**: Users accessing new resources

### Example Security Monitoring

```javascript
// Log security events
app.post('/login', async (req, res) => {
  try {
    const user = await authenticateUser(req.body);

    // Log successful login
    console.log('Successful login', {
      userId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    // Log failed login attempt
    console.log('Failed login attempt', {
      email: req.body.email,
      ip: req.ip,
      error: error.message,
      timestamp: new Date(),
    });

    await recordMetric('FailedLogins', 1);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

## Troubleshooting with CloudWatch

When problems occur, CloudWatch helps you understand what happened:

### Systematic Troubleshooting Approach

1. **Check dashboards**: Get overall system health at a glance
2. **Review alarms**: See what triggered and when
3. **Examine metrics**: Look for correlations between different systems
4. **Search logs**: Find detailed information about specific events
5. **Trace timeline**: Understand sequence of events leading to the problem

### Common Problem Patterns

**Sudden traffic spike**:

- Load balancer request count increases
- EC2 CPU utilization rises
- Database connection count grows
- Response times may increase

**Database performance issue**:

- Database CPU utilization high
- Query response times increase
- Application error rates rise
- Connection pool exhaustion

**Memory leak**:

- Memory utilization gradually increases over time
- Eventually leads to out-of-memory errors
- Application restarts temporarily fix the issue

## Alert Fatigue and Best Practices

Too many alerts can be worse than too few:

### Avoiding Alert Fatigue

**Set meaningful thresholds**: Base alerts on actual impact, not arbitrary numbers
**Use appropriate time windows**: Don't alert on brief spikes that resolve quickly
**Implement escalation**: Start with warnings, escalate to critical alerts
**Regular review**: Adjust thresholds based on experience

### Effective Alert Design

**Clear, actionable messages**: "Database CPU high, check slow queries" vs. "CPU alert"
**Include context**: Link to relevant dashboards or runbooks
**Appropriate urgency**: Critical alerts for service outages, warnings for optimization opportunities
**Test your alerts**: Verify they work and reach the right people

## Integration with Other Services

CloudWatch works well with other AWS services:

### Auto Scaling Integration

CloudWatch metrics trigger auto scaling policies automatically

### Lambda Integration

Lambda functions can process CloudWatch events and metrics

### SNS Integration

Send alerts to email, SMS, or chat applications

### Systems Manager Integration

Automate responses to CloudWatch alarms

## Monitoring Best Practices Summary

### Start Simple

- Begin with basic system metrics (CPU, memory, network)
- Add application-specific metrics gradually
- Focus on metrics that indicate user impact

### Be Consistent

- Use consistent naming conventions for metrics and logs
- Standardize dashboard layouts across teams
- Document what alerts mean and how to respond

### Plan for Growth

- Design monitoring that scales with your application
- Consider costs as monitoring usage increases
- Regular review and optimization of monitoring setup

## Next Steps

With comprehensive monitoring in place, you're ready to explore serverless computing with Lambda. CloudWatch integrates seamlessly with Lambda, providing detailed metrics and logs for your serverless functions.

The monitoring skills you've learned here apply to all AWS services and will help you build confidence in your cloud applications. Whether you're running traditional servers or serverless functions, good monitoring is essential for reliable, performant applications.

Remember that monitoring is not a one-time setup - it's an ongoing practice that improves with experience and helps you build better applications over time.

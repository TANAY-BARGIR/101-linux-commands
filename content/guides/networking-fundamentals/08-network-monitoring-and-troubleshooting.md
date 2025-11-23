---
title: 'Network Monitoring and Troubleshooting'
description: 'Tools and techniques for diagnosing network issues, monitoring performance, and maintaining network health.'
order: 8
---

Network problems are often invisible until they break something important. Good monitoring catches issues before users notice them, while systematic troubleshooting helps you fix problems quickly when they do occur.

## Prerequisites

- Understanding of networking fundamentals from previous sections
- Access to Linux/Unix systems for running diagnostic tools
- Basic familiarity with log files and system administration

## Essential Network Monitoring Tools

Let's start with the fundamental tools every developer should know.

### ping: Basic Connectivity Testing

ping sends ICMP packets to test if a host is reachable:

```bash
# Basic connectivity test
ping google.com

# Send specific number of packets
ping -c 4 google.com

# Measure packet loss and latency patterns
ping -c 100 -i 0.1 your-server.com
```

Look for patterns in the output:

```
64 bytes from google.com (172.217.12.14): icmp_seq=1 ttl=55 time=12.3 ms
64 bytes from google.com (172.217.12.14): icmp_seq=2 ttl=55 time=11.8 ms
64 bytes from google.com (172.217.12.14): icmp_seq=3 ttl=55 time=45.2 ms
```

Sudden spikes in response time (like the third packet) often indicate network congestion or processing delays.

### traceroute: Path Discovery

traceroute shows the path packets take to reach a destination:

```bash
# See the route to a destination
traceroute google.com

# Use UDP instead of ICMP (some firewalls block ICMP)
traceroute -U google.com

# Show IP addresses without DNS resolution for faster results
traceroute -n google.com
```

Each line represents a router hop:

```
1  192.168.1.1 (192.168.1.1)  1.234 ms  1.123 ms  1.456 ms
2  10.0.0.1 (10.0.0.1)  12.345 ms  11.234 ms  13.456 ms
3  * * *
4  203.0.113.1 (203.0.113.1)  23.456 ms  22.345 ms  24.567 ms
```

The `* * *` in line 3 means that router doesn't respond to traceroute packets (common for security reasons), but traffic still flows through it.

### netstat: Connection Analysis

netstat shows active network connections and listening services:

```bash
# Show all TCP and UDP connections
netstat -tuln

# Show connections with process information
netstat -tulnp

# Show only established connections
netstat -tln | grep ESTABLISHED

# Monitor connections in real-time
watch 'netstat -tuln | grep :80'
```

Understanding the output helps diagnose connection issues:

```
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program
tcp   0      0      0.0.0.0:22              0.0.0.0:*               LISTEN      1234/sshd
tcp   0      0      127.0.0.1:5432          0.0.0.0:*               LISTEN      5678/postgres
tcp   0      52     192.168.1.100:22        203.0.113.50:45678      ESTABLISHED 1234/sshd
```

### ss: Modern Socket Statistics

ss is the modern replacement for netstat with better performance:

```bash
# Show all sockets
ss -tuln

# Show established TCP connections
ss -t state established

# Show connections to specific port
ss -tn dport = :80

# Show process information
ss -tlnp
```

ss provides more detailed information and runs faster on busy systems.

## Application-Level Monitoring

Network monitoring extends beyond basic connectivity to application performance.

### HTTP Response Time Monitoring

Monitor web application performance:

```bash
# Measure HTTP response times
curl -w "@curl-format.txt" -o /dev/null -s http://your-api.com/health

# Create curl-format.txt with timing information
echo 'time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect:    %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n' > curl-format.txt
```

This breaks down where time is spent in HTTP requests:

```
time_namelookup:  0.003
time_connect:     0.012
time_appconnect:  0.045
time_pretransfer: 0.046
time_redirect:    0.000
time_starttransfer: 0.123
time_total:       0.125
```

### Database Connection Monitoring

Monitor database connectivity and performance:

```bash
# PostgreSQL connection monitoring
#!/bin/bash
DB_HOST="db.example.com"
DB_PORT="5432"
DB_NAME="app_production"

# Test basic connectivity
nc -zv $DB_HOST $DB_PORT

# Test application-level connectivity
psql "postgresql://user:pass@$DB_HOST:$DB_PORT/$DB_NAME" -c "SELECT 1;"

# Monitor active connections
psql "postgresql://user:pass@$DB_HOST:$DB_PORT/$DB_NAME" -c "
SELECT count(*) as active_connections,
       state,
       client_addr
FROM pg_stat_activity
WHERE state = 'active'
GROUP BY state, client_addr;"
```

### TCP Connection Health

Monitor TCP connection states and errors:

```bash
# Count connections by state
ss -tan | awk 'NR>1 {++S[$1]} END {for (a in S) print a,S[a]}'

# Monitor TCP retransmissions (sign of network problems)
netstat -s | grep -i retrans

# Watch for connection errors
dmesg | grep -i "tcp\|network"
```

## Log-Based Network Monitoring

System and application logs contain valuable networking information.

### System Log Analysis

Look for network-related messages in system logs:

```bash
# Check for network interface errors
dmesg | grep -i "network\|eth\|link"

# Monitor authentication failures (potential attacks)
grep "Failed password" /var/log/auth.log | tail -20

# Check for firewall blocks
grep "BLOCK" /var/log/ufw.log | tail -20

# Monitor DNS resolution issues
grep "resolve" /var/log/syslog | tail -20
```

### Application Log Patterns

Monitor application logs for network issues:

```bash
# Web server logs - look for error patterns
tail -f /var/log/nginx/error.log | grep -E "(timeout|refused|unreachable)"

# Application logs - database connection issues
tail -f /var/log/app/application.log | grep -E "(connection.*failed|timeout|refused)"

# API response time monitoring
tail -f /var/log/nginx/access.log | awk '$NF > 1000 {print $0}' # Slow requests > 1 second
```

### Structured Log Analysis

For applications that produce structured logs:

```bash
# Parse JSON logs for network metrics
tail -f app.log | jq 'select(.response_time_ms > 1000) | {timestamp, endpoint, response_time_ms}'

# Monitor error rates
tail -f app.log | jq -r 'select(.level == "ERROR" and .message | contains("network")) | .timestamp + " " + .message'
```

## Network Performance Monitoring

Understanding network performance helps optimize applications and identify bottlenecks.

### Bandwidth Testing

Measure available bandwidth:

```bash
# iperf3 - requires server on remote end
iperf3 -c iperf.example.com

# Test download speed
wget -O /dev/null http://speedtest.example.com/100MB.bin

# Test with curl and measure time
time curl -o /dev/null http://example.com/largefile.zip
```

### Latency Monitoring

Track latency patterns over time:

```bash
# Continuous latency monitoring
#!/bin/bash
TARGET="api.example.com"
LOG_FILE="/var/log/latency-monitor.log"

while true; do
    LATENCY=$(ping -c 1 $TARGET | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}')
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$TIMESTAMP $TARGET $LATENCY" >> $LOG_FILE
    sleep 60
done
```

### Network Interface Statistics

Monitor network interface performance:

```bash
# Interface statistics
cat /proc/net/dev

# Detailed interface information
ip -s link show

# Monitor interface errors
watch 'cat /proc/net/dev | grep -E "(eth0|wlan0)"'

# Network interface utilization
vnstat -i eth0 -l  # Live monitoring
vnstat -i eth0 -d  # Daily statistics
```

## Automated Network Monitoring

Set up automated monitoring to catch issues proactively.

```
Network Monitoring Architecture

┌─────────────────────────────────────────────────────────────────────────┐
│                           Monitoring Infrastructure                     │
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   Prometheus    │    │    Grafana      │    │  AlertManager   │      │
│  │   (Metrics)     │    │  (Dashboards)   │    │   (Alerts)      │      │
│  │                 │    │                 │    │                 │      │
│  │  ┌─────────────┐│    │  ┌─────────────┐│    │  ┌─────────────┐│      │
│  │  │Network      ││    │  │Latency      ││    │  │Email        ││      │
│  │  │Metrics DB   ││    │  │Dashboard    ││    │  │Slack        ││      │
│  │  └─────────────┘│    │  └─────────────┘│    │  │PagerDuty    ││      │
│  └─────────────────┘    └─────────────────┘    │  └─────────────┘│      │
│           ▲                        ▲           └─────────────────┘      │
│           │                        │                     ▲              │
│           │                        └─────────────────────┘              │
│           │                                                             │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────────┐
│                          Target Infrastructure                          │
│                                                                         │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│ │   Web-1     │  │   API-1     │  │Database-1   │  │Load Balancer│      │
│ │             │  │             │  │             │  │             │      │
│ │┌───────────┐│  │┌───────────┐│  │┌───────────┐│  │┌───────────┐│      │
│ ││node_export││  ││node_export││  ││node_export││  ││blackbox   ││      │
│ ││:9100      ││  ││:9100      ││  ││:9100      ││  ││exporter   ││      │
│ │└───────────┘│  │└───────────┘│  │└───────────┘│  ││:9115      ││      │
│ │             │  │             │  │             │  │└───────────┘│      │
│ └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│        │                │                │                │             │
│        ▼                ▼                ▼                ▼             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                    Network Metrics                                  │ │
│ │                                                                     │ │
│ │ • Interface utilization (rx/tx bytes)                               │ │
│ │ • Connection counts (established, time_wait)                        │ │
│ │ • Packet loss and error rates                                       │ │
│ │ • Latency measurements (ping, HTTP response time)                   │ │
│ │ • DNS resolution time                                               │ │
│ │ • SSL certificate expiration                                        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

Monitoring Flow:
1. Exporters collect metrics from infrastructure
2. Prometheus scrapes and stores metrics
3. Grafana visualizes metrics in dashboards
4. AlertManager sends notifications when thresholds exceeded
5. Engineers respond to alerts and fix issues
```

### Simple Health Check Script

```bash
#!/bin/bash
# network-health-check.sh

SERVICES=(
    "google.com:80"
    "api.example.com:443"
    "db.example.com:5432"
)

ALERT_EMAIL="ops@example.com"
LOG_FILE="/var/log/network-health.log"

check_service() {
    local host_port=$1
    local host=${host_port%:*}
    local port=${host_port#*:}

    if nc -zv $host $port 2>/dev/null; then
        echo "$(date): $host_port OK" >> $LOG_FILE
        return 0
    else
        echo "$(date): $host_port FAILED" >> $LOG_FILE
        echo "Network check failed for $host_port" | mail -s "Network Alert" $ALERT_EMAIL
        return 1
    fi
}

for service in "${SERVICES[@]}"; do
    check_service $service
done
```

Run this script every 5 minutes via cron:

```bash
# Add to crontab
*/5 * * * * /usr/local/bin/network-health-check.sh
```

### Prometheus Network Monitoring

For more sophisticated monitoring, use Prometheus with node_exporter:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
    metrics_path: /metrics
    scrape_interval: 5s
```

Query network metrics:

```bash
# Network bytes received
rate(node_network_receive_bytes_total[5m])

# Network errors
rate(node_network_receive_errs_total[5m])

# TCP connection states
node_netstat_Tcp_CurrEstab
```

## Troubleshooting Network Issues

When network problems occur, systematic troubleshooting saves time.

```
Network Troubleshooting Flow

Problem: "I can't connect to the application!"
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 1: Physical/Link Layer                                    │
│ ┌─────────────────┐    ┌─────────────────┐                     │
│ │ Check cables    │    │ Check WiFi      │                     │
│ │ ip link show    │    │ iwconfig        │                     │
│ └─────────────────┘    └─────────────────┘                     │
└─────────────────────────┬──────────────────────────────────────┘
                          │ ✓ Links are UP
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 2: Network Layer (IP)                                     │
│ ┌─────────────────┐    ┌─────────────────┐                     │
│ │ ping gateway    │    │ ping 8.8.8.8    │                     │
│ │ ping 192.168.1.1│    │ (test internet) │                     │
│ └─────────────────┘    └─────────────────┘                     │
└─────────────────────────┬──────────────────────────────────────┘
                          │ ✓ IP routing works
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 3: DNS Resolution                                         │
│ ┌─────────────────┐    ┌─────────────────┐                     │
│ │ nslookup        │    │ dig             │                     │
│ │ app.example.com │    │ app.example.com │                     │
│ └─────────────────┘    └─────────────────┘                     │
└─────────────────────────┬──────────────────────────────────────┘
                          │ ✓ DNS resolves correctly
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 4: Transport Layer (Ports)                                │
│ ┌─────────────────┐    ┌─────────────────┐                     │
│ │ telnet host 80  │    │ nc -zv host 443 │                     │
│ │ (test HTTP)     │    │ (test HTTPS)    │                     │
│ └─────────────────┘    └─────────────────┘                     │
└─────────────────────────┬──────────────────────────────────────┘
                          │ ✓ Ports are open
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 5: Application Layer                                      │
│ ┌─────────────────┐    ┌─────────────────┐                     │
│ │ curl -I         │    │ Check app logs  │                     │
│ │ http://app.com  │    │ /var/log/app    │                     │
│ └─────────────────┘    └─────────────────┘                     │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
                    Problem Found!

Common Issues by Layer:
┌─────────────┬─────────────────────────────────────────────────────┐
│ Layer       │ Common Problems                                     │
├─────────────┼─────────────────────────────────────────────────────┤
│ Physical    │ Cable unplugged, WiFi disconnected                  │
│ Network     │ Wrong IP, gateway down, routing misconfigured       │
│ DNS         │ Wrong nameserver, domain expired, propagation delay │
│ Transport   │ Firewall blocking, service not listening            │
│ Application │ App crashed, misconfigured, database connection     │
└─────────────┴─────────────────────────────────────────────────────┘
```

### The OSI Model Troubleshooting Approach

Work through the network layers systematically:

**Layer 1 (Physical)**: Are cables connected? Is WiFi working?

```bash
# Check interface status
ip link show

# Check for hardware errors
dmesg | grep -i "link\|cable\|phy"
```

**Layer 2 (Data Link)**: Can you reach other machines on the same network?

```bash
# Check ARP table
arp -a

# Test local network connectivity
ping 192.168.1.1  # Gateway
```

**Layer 3 (Network)**: Can you reach remote networks?

```bash
# Check routing
ip route show

# Test internet connectivity
ping 8.8.8.8
```

**Layer 4 (Transport)**: Are ports open and services responding?

```bash
# Test specific ports
telnet example.com 80
nc -zv example.com 443
```

**Layer 7 (Application)**: Is the application working correctly?

```bash
# Test application endpoints
curl -I http://api.example.com/health
```

### Common Network Problems and Solutions

**DNS Resolution Issues:**

```bash
# Symptoms: Can ping IP but not hostname
ping 8.8.8.8  # Works
ping google.com  # Fails

# Troubleshooting
nslookup google.com
dig google.com

# Check DNS configuration
cat /etc/resolv.conf

# Try different DNS servers
nslookup google.com 8.8.8.8
```

**Firewall Blocking Traffic:**

```bash
# Symptoms: Connection timeouts or immediate refusal
telnet example.com 80  # Hangs or "Connection refused"

# Check local firewall
sudo ufw status
sudo iptables -L

# Check remote firewall (if you have access)
# Test from different source IPs
```

**Network Congestion:**

```bash
# Symptoms: High latency, packet loss
ping -c 100 example.com | grep "packet loss"

# Check interface utilization
vnstat -i eth0 -l

# Monitor for retransmissions
netstat -s | grep -i retrans
```

**SSL/TLS Issues:**

```bash
# Test SSL connectivity
openssl s_client -connect example.com:443

# Check certificate validity
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Network Security Monitoring

Monitor for security issues and attacks.

### Failed Authentication Monitoring

```bash
# SSH brute force attempts
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr

# Web authentication failures
grep "401\|403" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr
```

### Port Scan Detection

```bash
# Monitor for port scanning attempts
netstat -an | grep SYN_RECV | wc -l

# Detect connection attempts to closed ports
grep "Connection attempt" /var/log/messages
```

### DDoS Attack Monitoring

```bash
# Monitor connection counts by IP
netstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -nr | head -20

# Monitor request rates in web logs
tail -f /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr
```

## Performance Baselines and Alerting

Establish performance baselines to detect anomalies.

### Creating Performance Baselines

```bash
# Collect baseline network metrics
#!/bin/bash
BASELINE_FILE="/var/log/network-baseline.log"

# Collect metrics for a week during normal operations
echo "$(date): Latency to google.com: $(ping -c 5 google.com | tail -1 | awk -F'/' '{print $5}')" >> $BASELINE_FILE
echo "$(date): DNS resolution time: $(time nslookup google.com 2>&1 | grep real | awk '{print $2}')" >> $BASELINE_FILE
echo "$(date): HTTP response time: $(curl -w '%{time_total}' -o /dev/null -s http://api.example.com)" >> $BASELINE_FILE
```

### Alerting Thresholds

Set up alerts based on deviations from baselines:

```bash
# Alert if latency exceeds baseline by 50%
BASELINE_LATENCY=20  # milliseconds
CURRENT_LATENCY=$(ping -c 1 google.com | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}' | cut -d'.' -f1)

if [ $CURRENT_LATENCY -gt $((BASELINE_LATENCY * 150 / 100)) ]; then
    echo "High latency detected: ${CURRENT_LATENCY}ms" | mail -s "Network Alert" ops@example.com
fi
```

## Advanced Troubleshooting Tools

For complex network issues, specialized tools provide deeper insights.

### tcpdump: Packet Capture

Capture and analyze network packets:

```bash
# Capture packets on specific interface
sudo tcpdump -i eth0

# Capture HTTP traffic
sudo tcpdump -i eth0 port 80

# Capture and save to file
sudo tcpdump -i eth0 -w network-capture.pcap

# Filter by host
sudo tcpdump -i eth0 host api.example.com

# Show packet contents
sudo tcpdump -i eth0 -A port 80
```

### Wireshark: Packet Analysis

For detailed packet analysis, use Wireshark (GUI tool) or tshark (command line):

```bash
# Analyze saved packet capture
tshark -r network-capture.pcap

# Filter HTTP requests
tshark -r network-capture.pcap -Y http.request

# Extract timing information
tshark -r network-capture.pcap -T fields -e frame.time -e tcp.analysis.ack_rtt
```

### strace: System Call Tracing

Debug application network behavior:

```bash
# Trace network system calls for a process
strace -e trace=network -p <pid>

# Trace a command's network activity
strace -e trace=network curl http://example.com

# Save trace to file for analysis
strace -e trace=network -o network-trace.log -p <pid>
```

In the next section, we'll explore network automation - how to manage network configurations, deployments, and monitoring using infrastructure as code principles.

Network monitoring and troubleshooting are skills that improve with practice. Start with the basic tools, build your understanding of normal network behavior, and gradually add more sophisticated monitoring as your infrastructure grows.

Happy troubleshooting!

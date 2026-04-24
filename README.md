# 🛡 NetWatch — AWS Network Traffic Monitoring Tool

> A full-stack, production-grade network traffic monitor using **13 AWS services** with a premium dark dashboard UI.

## 🏗 Architecture Overview

```
Internet → CloudFront → S3 (Frontend)
                    ↓
VPC Traffic → VPC Flow Logs → CloudWatch Logs
                           → S3 (Raw Logs)
                           → Kinesis Data Stream
                                      ↓
                               Lambda Processor
                               ├── DynamoDB (store)
                               ├── CloudWatch (metrics)
                               └── SNS (alerts)
                                      ↓
                               API Gateway → Lambda API
                                              ↓
                                         Dashboard (React)

Security Layer:
  WAFv2 → API Gateway
  GuardDuty → SNS Alerts
  Shield → DDoS Protection
  Macie → S3 Data Scanning
  Security Hub → Aggregation
```

## 📦 AWS Services Used (13)

| # | Service | Purpose |
|---|---------|---------|
| 1 | **VPC + Flow Logs** | Capture all network traffic |
| 2 | **S3** | Store raw flow logs + host frontend |
| 3 | **Kinesis Data Stream** | Real-time log streaming |
| 4 | **Lambda** | Process logs + serve API |
| 5 | **DynamoDB** | Store processed log records |
| 6 | **CloudWatch** | Metrics, alarms, dashboards |
| 7 | **SNS** | Alert notifications (email/SMS) |
| 8 | **API Gateway** | REST API for frontend |
| 9 | **CloudFront** | CDN for frontend delivery |
| 10 | **WAFv2** | Block SQL injection, rate limit |
| 11 | **GuardDuty** | AI threat detection |
| 12 | **Athena** | SQL queries on S3 logs |
| 13 | **Macie** | Sensitive data detection |

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/YOUR_USERNAME/netwatch.git
cd netwatch
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:3000
```

### 3. Backend (Lambda)
```bash
# Package Lambda functions
cd backend/lambdas
zip -r traffic_processor.zip traffic_processor.py
zip -r api_handler.zip api_handler.py
```

### 4. Deploy Infrastructure
```bash
# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file backend/infrastructure/cloudformation.yaml \
  --stack-name netwatch-stack \
  --parameter-overrides AlertEmail=your@email.com BucketSuffix=your-unique-id \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 5. Deploy Frontend to S3
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://netwatch-frontend-YOUR_SUFFIX --delete
```

## 📁 Project Structure

```
netwatch/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── styles.css
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Analytics.jsx
│   │       ├── Alerts.jsx
│   │       ├── Logs.jsx
│   │       └── Settings.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── backend/
│   ├── lambdas/
│   │   ├── traffic_processor.py
│   │   └── api_handler.py
│   └── infrastructure/
│       └── cloudformation.yaml
└── README.md
```

## 🔐 IAM Permissions Required

Your AWS CLI user needs:
- CloudFormation: FullAccess
- IAM: CreateRole, AttachPolicy
- VPC: FullAccess
- Lambda: FullAccess
- S3: FullAccess
- DynamoDB: FullAccess
- Kinesis: FullAccess
- CloudWatch: FullAccess
- SNS: FullAccess
- APIGateway: FullAccess
- CloudFront: FullAccess
- WAF: FullAccess

## 💰 Free Tier Eligibility

| Service | Free Tier Limit |
|---------|----------------|
| Lambda | 1M requests/month |
| DynamoDB | 25 GB storage |
| S3 | 5 GB storage |
| CloudWatch | 10 custom metrics |
| SNS | 1M publishes |
| Kinesis | 5MB/s for 1 shard |
| API Gateway | 1M API calls |
| CloudFront | 1 TB data transfer |

> ⚠️ GuardDuty, Shield Standard, and WAF have 30-day free trials.
> Macie has a 30-day free trial. Athena charges $5/TB scanned.

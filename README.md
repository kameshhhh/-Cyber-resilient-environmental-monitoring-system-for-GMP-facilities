Cyber-Resilient Environmental Monitoring System for GMP Facilities

A full-stack web-based environmental monitoring + alerting platform designed for GMP facilities (pharma/biotech/clean rooms) to continuously track critical parameters such as temperature, humidity, and air quality, and ensure data integrity, security, and resilience against cyber threats and failures.

🚀 Problem Statement

GMP (Good Manufacturing Practice) facilities must maintain controlled environmental conditions. Even minor deviations in:

Temperature

Humidity

Air quality (PM/CO₂)

can impact product quality, patient safety, and regulatory compliance.

Most monitoring setups fail due to:

Poor alerting systems

No secure access control

No audit logs

Data tampering risk

No fail-safe storage & recovery strategy

✅ This project solves it with real-time monitoring + cyber-resilient design.

✅ Key Features
🌡️ Real-Time Environmental Monitoring

Live tracking of environmental parameters

Dashboard view for facility operators

History logs for analysis and compliance reporting

🚨 Alerts & Threshold Management

Configurable safe limits per environment/room

Alerts on abnormal conditions (out-of-range values)

🔐 Cyber-Resilience & Security

Role-based access control (Admin/Operator)

Secure authentication & session management

Audit logging (who accessed/modified data)

Reduced attack surface with reverse proxy (Nginx)

Separation of frontend + backend services

📊 Monitoring & Observability

Prometheus configuration included for service monitoring

Production-ready deployment structure using Docker

🏗️ Tech Stack

Frontend

React.js

UI dashboard + data visualization

Backend / Data

Supabase (Database + Auth)

DevOps / Deployment

Docker + Docker Compose

Nginx (reverse proxy)

Prometheus (monitoring)

🧠 System Architecture (High Level)

Sensors / Input Source

Data stored securely in Supabase database

Web dashboard fetches live + historical data

Alerts triggered on threshold violations

Access controlled by authentication & user roles

Logging for traceability

📂 Project Structure
.
├── public/                     # Static assets
├── src/                        # React frontend source code
├── Dockerfile                  # App container build
├── docker-compose.yml          # Dev deployment
├── docker-compose.prod.yml     # Production deployment
├── nginx.conf                  # Reverse proxy config
├── prometheus.yml              # Monitoring configuration
├── SUPABASE_SETUP.md           # Supabase setup guide
└── README.md                   # Documentation

⚙️ Setup & Installation (Local)
✅ 1) Clone the Repository
git clone https://github.com/kameshhhh/-Cyber-resilient-environmental-monitoring-system-for-GMP-facilities.git
cd -Cyber-resilient-environmental-monitoring-system-for-GMP-facilities

✅ 2) Install Dependencies
npm install

✅ 3) Configure Environment Variables

Create a .env file in the project root:

REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key


✅ Refer: SUPABASE_SETUP.md

▶️ Run the Project
Run with npm
npm start


App will run at:

http://localhost:3000

🐳 Run Using Docker
Development Mode
docker-compose up --build

Production Mode
docker-compose -f docker-compose.prod.yml up --build

📈 Monitoring with Prometheus

This repository includes a prometheus.yml configuration to support monitoring of deployed services.

To use Prometheus:

Install Prometheus

Load the config file

Start Prometheus and view metrics at:

http://localhost:9090

🧪 Example Use Cases

✅ GMP Clean Room Monitoring
✅ Pharma Storage Condition Tracking
✅ Lab Monitoring & Compliance Logging
✅ Alert System for Critical Deviations
✅ Secure multi-user monitoring dashboard

🔮 Future Enhancements

Planned improvements:

IoT sensor integration (ESP32 / MQTT)

SMS/Email alerts (Twilio / SendGrid)

AI-based anomaly detection

Full audit trail export (CSV/PDF)

Compliance-ready reports (21 CFR Part 11 style approach)

👨‍💻 Author

Kamesh
Project: Cyber-Resilient Environmental Monitoring System for GMP Facilities

📜 License

This project is for learning/hackathon/demo purposes.

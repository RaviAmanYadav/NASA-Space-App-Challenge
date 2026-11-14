# 🚀 Astro Health Monitor

A visual self-assessment tool that helps astronauts check their own health during long space missions and gives them guidance on what to do next.

Built for the **NASA Space Apps Challenge [year]**.
Challenge: *Health Monitoring Software for Astronauts on Space Missions*

## The Problem
On long missions (Moon, Mars), astronauts are far from Earth and communication with doctors can be delayed. They are exposed to NASA HRP's five hazards: radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments. Astronauts need to assess their health themselves and know when to contact flight surgeons.

## Our Solution
- Astronaut enters daily indicators: heart rate, blood pressure, blood glucose, body temperature, sleep hours, mood
- Backend checks each value and marks it **Normal / Watch / Alert**
- Clickable human body figure shows the status of each body system
- Each result comes with an explanation and recommended actions
- Tells the astronaut when to contact the ground medical team

## Features
- Interactive body map (brain, heart, metabolism, body temperature)
- Colour-coded health status
- Preventive guidance for every indicator
- [Add: trend charts / offline mode / etc. if you build them]

## Tech Stack
| Part | Technology |
|------|-----------|
| Frontend | React (Vite) |
| Backend | Java, Spring Boot |
| Communication | REST API (JSON) |

## How to Run

**Backend**
```bash
cd astrohealth
./mvnw spring-boot:run
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Why These Indicators?
| Indicator | Spaceflight link |
|-----------|-----------------|
| Heart rate / BP | Fluid shifts in microgravity affect the cardiovascular system |
| Blood glucose | Stress and diet changes affect metabolism |
| Body temperature | Closed cabin: heat buildup and infection spread |
| Sleep | Disturbed light cycles and noise |
| Mood | Isolation and confinement |

## Data Sources and References
- NASA Human Research Program (HRP): https://www.nasa.gov/hrp
- [Add every other source you actually used]

## Disclaimer
This is an educational prototype made for a hackathon. It is **not a medical device**. Health thresholds are simplified and should be validated by flight surgeons.

## Team
- [Name 1] – [role]
- [Name 2] – [role]

## Demo
- Video: [link]
- Screenshots: add images in `/screenshots`

## License
MIT

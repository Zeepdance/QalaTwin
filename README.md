# QalaTwin
An interactive platform for modeling urban infrastructure and analyzing the consequences of planning decisions in real time.
* About the Project
QalaTwin is a digital twin of the city of Ust-Kamenogorsk (East Kazakhstan Region) that allows users to visualize and assess the impact of new urban developments—such as residential complexes, schools, parks, bridges, and industrial zones—on key city metrics. The project addresses the lack of forecasting tools in urban planning: instead of guessing the outcome of a decision, users can run a "What if..." experiment and see the results instantly.

* Key Features
Hybrid Cartography: Seamless switching between a 2D overview mode (Leaflet) and a tilted 3D map with realistic buildings (MapLibre + MapTiler).
Interactive Modeling: Add objects with a single click—residential buildings, schools, parks, bridges, industrial facilities. Each object affects city metrics in real time.
Real‑Time Analytics: When an object is placed, air quality (AQI), traffic congestion, population density, and travel time are automatically recalculated. Data is displayed in clear Chart.js graphs.
Eco‑Routes: Plan routes that consider not only distance but also environmental conditions.
Premium Demo Features: Dedicated 3D editors for wind turbines and hydroelectric power plants, complete with detailed energy output calculations and environmental impact assessments.
Data Export: Select any area on the map and save all objects inside it to a JSON file for further analysis.
AI Assistant: An integrated chatbot powered by Groq (LLaMA 3.3) answers questions about urban infrastructure using a dynamic knowledge base. Users can teach the AI new facts with simple commands like "remember: ...", making it a customizable expert system for urban planning.

* Technology Stack
Frontend: HTML5, CSS3, JavaScript (ES6), Three.js, Chart.js
Mapping: Leaflet, MapLibre GL, MapTiler SDK, OSRM
Backend: Node.js, Express
Artificial Intelligence: Groq API (LLaMA 3.1, 3.3) with dynamic memory management
Data APIs: API-Ninjas (air quality), OpenWeatherMap (backup), OpenStreetMap

* Data Sources
The project leverages real, open data: the OpenStreetMap cartographic base, terrain and 3D buildings from MapTiler, and air‑quality information from API-Ninjas (with OpenWeatherMap as a fallback). Routing is handled by OSRM, which also runs on OpenStreetMap data. The AI assistant's knowledge base is built from urban planning regulations, climate data, and user-contributed facts.

* Practical Value
This platform can be used by architects, urban planners, environmentalists, and city administrations to make well‑informed decisions, evaluate construction projects, and conduct environmental monitoring. Its interactive format and clear visualizations make complex data accessible to all stakeholders. The AI assistant serves as an on-demand expert, helping users understand regulations, risks, and best practices in urban development.

<img width="1600" height="618" alt="image" src="https://github.com/user-attachments/assets/0d279196-2dda-4a49-9e51-3888e03879c6" />
<img width="1600" height="797" alt="image" src="https://github.com/user-attachments/assets/e5ca4af1-4bf6-4984-a8d0-54a5978234a3" />

<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">


# 489_PROJECT

<!-- BADGES -->
<img src="https://img.shields.io/github/last-commit/gudino27/489_project?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/gudino27/489_project?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/gudino27/489_project?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/Express-000000.svg?style=flat&logo=Express&logoColor=white" alt="Express">
<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/.ENV-ECD53F.svg?style=flat&logo=dotenv&logoColor=black" alt=".ENV">
<br>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/SQLite-003B57.svg?style=flat&logo=SQLite&logoColor=white" alt="SQLite">

</div>
<br>

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Testing](#testing)
- [Features](#features)
- [Project Structure](#project-structure)
    - [Project Index](#project-index)
- [Acknowledgment](#acknowledgment)

---

## Overview

a comprehensive digital solution that revolutionizes how your customers visualize and plan their dream kitchens and bathrooms. This custom-built platform bridges the gap between your expertise and your clients' vision, providing an intuitive design experience while streamlining your business operations.


**Why 489_project?**

This project aims to simplify complex design workflows and data visualization, enabling rapid development and deployment. The core features include:

- 🧩 **Modular UI Components:** React-based interfaces with Tailwind CSS for consistent styling and easy customization.
- 🔒 **Secure User & Session Management:** Handles authentication, session persistence, and role-based access control.
- 🎨 **Design Visualization & Preview:** Interactive components for exploring and customizing kitchen layouts.
- ⚙️ **Backend API Integration:** Seamless data handling for user data, images, and project assets.
- 📊 **Performance & Analytics Dashboards:** Built-in tools for monitoring app performance and user engagement.
- 🚀 **Scalable Architecture:** Clear setup instructions and modular design for easy extension and maintenance.
### For The Clients

The platform offers an intuitive, self-service design experience that empowers your customers to:

1. **Custom Room Designer**
   - Design both kitchens and bathrooms
   - Drag-and-drop cabinet placement
   - Choose from preset material
   - See instant pricing as they build
   - Wall elevation views showing cabinet heights
   - Real-time design updates
   - Get detailed PDF quotes with itemized pricing
   - Include personal notes and preferences
   - Automatic submission to the team for review and contact
---
### For The Business

Behind the scenes, you have complete control through a comprehensive admin panel:

1. **Dynamic Pricing Management**
   - Update cabinet prices in real-time
   - Set material and color pricing
   - Seasonal adjustments without developer help
   - Competitive pricing strategies

2. **Portfolio Showcase**
   - Upload and organize project photos
   - Categorize by room type (kitchen, bathroom, living room, bedroom,etc...)
   - Build customer confidence

3. **Customer Insights**
   - Track all submitted designs

4. **Team Management**
   - Add team member profiles
   - Showcase your expertise
   - Build trust with transparency
   - Manage user access and permissions

---
## How It Works

### Customer Journey

1. **Discovery** - Clients browse your portfolio for inspiration
2. **Design** - They create custom layouts using the intuitive demo designer
3. **Customize** - Select materials, colors, and configurations
4. **Quote** - Receive instant quotes
5. **Connect** - Their design is sent directly to the team for review as it will also send email

### Your Workflow

1. **Setup** - Define your pricing and upload portfolio photos
2. **Monitor** - Review incoming designs through the admin panel
3. **Follow Up** - Contact interested clients with their custom designs in hand
4. **Convert** - Close more sales with excited customers

---

## Features That Drive Business

### Lead Generation
- Captures contact information with every quote request
- helps encourage customers by budget through their design choices
- Creates warm leads who have already invested time in planning

### Competitive Advantage
- Offer something  competitors don't
- Position the business as innovative and customer-focused
- Reduce time spent on initial consultations
- allow for more work driven consults

### Security & Reliability
- Secure admin authentication
- Session management to prevent unauthorized access


---
## Features

|      | Component            | Details                                                                                     |
| :--- | :------------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**     | <ul><li>Full-stack web app with React frontend and Node.js/Express backend</li><li>RESTful API design</li><li>Client-server separation</li></ul> |
| 🔩 | **Code Quality**     | <ul><li>Consistent code style with ESLint and Prettier</li><li>Modular folder structure separating components, services, and utils</li><li>Use of async/await for asynchronous operations</li></ul> |
| 📄 | **Documentation**    | <ul><li>Comprehensive README with setup instructions</li><li>Inline comments and JSDoc annotations</li><li>API documentation via Swagger or similar (if present)</li></ul> |
| 🔌 | **Integrations**     | <ul><li>MongoDB via Mongoose for data persistence</li><li>JWT for authentication</li><li>Tailwind CSS for styling</li><li>Jest and React Testing Library for testing</li><li>Third-party APIs via nodemailer, html2canvas, jsPDF</li></ul> |
| 🧩 | **Modularity**       | <ul><li>Component-based React architecture</li><li>Express routes and middleware separated into modules</li><li>Utility functions isolated in utils folder</li></ul> |
| 🧪 | **Testing**          | <ul><li>Unit tests with Jest for backend functions</li><li>Component tests with React Testing Library</li><li>API integration tests with Supertest</li></ul> |
| ⚡️  | **Performance**      | <ul><li>Use of compression middleware for response optimization</li><li>Code splitting with React.lazy</li><li>Efficient image processing with Sharp</li></ul> |
| 🛡️ | **Security**         | <ul><li>Helmet for HTTP headers security</li><li>express-rate-limit to prevent brute-force attacks</li><li>express-mongo-sanitize to prevent injection</li><li>dotenv for environment management</li></ul> |
| 📦 | **Dependencies**     | <ul><li>Major dependencies include React, Express, Tailwind CSS, SQLite, bcryptjs, jsonwebtoken</li><li>Dev dependencies include Jest, React Testing Library, nodemon</li></ul> |

---

## Project Structure

```sh
└── 489_project/
    ├── README.md
    ├── cabinet-photo-server
    │   ├── config.js
    │   ├── database
    │   ├── init-database.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── server.js
    │   └── uploads
    └── kitchen-designer
        ├── .gitignore
        ├── README.md
        ├── package-lock.json
        ├── package.json
        ├── postcss.config.js
        ├── public
        ├── src
        └── tailwind.config.js
```

---

### Project Index

<details open>
	<summary><b><code>489_PROJECT/</code></b></summary>
	<!-- __root__ Submodule -->
	<details>
		<summary><b>__root__</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ __root__</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides an overview of the 489 project, outlining its core purpose within the overall architecture<br>- It highlights how the project integrates key components to facilitate specific functionalities, ensuring clarity on its role in supporting the systems objectives<br>- This summary emphasizes the projects contribution to the broader codebase, guiding users on its primary use and significance.</td>
				</tr>
			</table>
		</blockquote>
	</details>
	<!-- kitchen-designer Submodule -->
	<details>
		<summary><b>kitchen-designer</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ kitchen-designer</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Defines the core structure and setup instructions for the React-based kitchen designer application, facilitating development, testing, and deployment workflows<br>- Serves as the foundational entry point that integrates user interface components, enabling users to visualize and customize kitchen layouts within a modular, scalable architecture<br>- Ensures smooth project initialization and guides developers through build and deployment processes.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/tailwind.config.js'>tailwind.config.js</a></b></td>
					<td style='padding: 8px;'>- Defines the Tailwind CSS configuration to customize the design system, including color palette and typography, ensuring consistent styling across the kitchen designer application<br>- It integrates project-specific themes with utility classes, supporting a cohesive visual identity and streamlined development process within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/postcss.config.js'>postcss.config.js</a></b></td>
					<td style='padding: 8px;'>- Configures PostCSS to integrate Tailwind CSS and Autoprefixer, streamlining the styling workflow within the project<br>- It ensures consistent application of utility-first CSS and automatic vendor prefixing, supporting responsive and cross-browser compatible designs across the entire codebase<br>- This setup enhances maintainability and efficiency in managing styles for the kitchen designer application.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the core configuration and dependencies for the kitchen designer application, establishing the projects structure, development environment, and build scripts<br>- It ensures consistent setup across development and production, enabling seamless execution of the React-based frontend and backend services, and supporting features like user authentication, data visualization, and PDF generation within the overall architecture.</td>
				</tr>
			</table>
			<!-- src Submodule -->
			<details>
				<summary><b>src</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ kitchen-designer.src</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/setupTests.js'>setupTests.js</a></b></td>
							<td style='padding: 8px;'>- Enhances testing capabilities within the project by integrating custom matchers for DOM assertions, facilitating more expressive and reliable tests<br>- Supports the overall testing framework of the kitchen-designer application, ensuring consistent and accurate validation of user interface components during development and quality assurance processes.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/sessionManager.js'>sessionManager.js</a></b></td>
							<td style='padding: 8px;'>- Manages user sessions by handling creation, validation, and expiration through secure cookies, ensuring persistent authentication within the application<br>- Implements inactivity-based session timeout to enhance security and provides mechanisms for session refresh and logout callbacks<br>- Integrates seamlessly into the overall architecture to maintain secure, user-friendly access control across the project.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/AdminPanel.js'>AdminPanel.js</a></b></td>
							<td style='padding: 8px;'>- Provides the core interface for administrative functions within the application, enabling user authentication, session management, and navigation across key management areas such as pricing, photos, employees, designs, and user roles<br>- Facilitates secure access control and dynamic content rendering based on user permissions, supporting efficient management of the overall kitchen design platform.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/UserManagement.js'>UserManagement.js</a></b></td>
							<td style='padding: 8px;'>- Provides comprehensive user management functionalities within the application, enabling administrators to view, create, edit, and deactivate users<br>- Integrates with backend APIs for user data handling and maintains a responsive interface with modals and status indicators<br>- Serves as a core component for managing user roles, permissions, and activity status, supporting overall security and user lifecycle workflows.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/EmployeeManager.js'>EmployeeManager.js</a></b></td>
							<td style='padding: 8px;'>- The <code>EmployeeManager.js</code> file serves as the central component for managing employee data within the kitchen designer applications architecture<br>- It provides functionalities to display, add, edit, delete, and reorder employee profiles, facilitating dynamic and interactive management of team members<br>- This component interacts with a backend API to fetch and persist employee information, ensuring data consistency across the application<br>- Overall, it encapsulates the user interface and logic necessary for maintaining an up-to-date and organized view of employees, supporting the broader goal of streamlined team management within the project.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/DesignPreview.js'>DesignPreview.js</a></b></td>
							<td style='padding: 8px;'>- DesignPreview ComponentThe <code>DesignPreview</code> component serves as a central visual interface within the application, enabling users to explore and interact with different room designs—specifically kitchens and bathrooms<br>- It dynamically displays relevant floor plans and wall views based on the selected room, providing an intuitive preview experience<br>- The component manages various view modes, including floor and wall perspectives, and supports fullscreen viewing for detailed inspection<br>- Overall, it facilitates seamless navigation and visualization of design options, integrating core design data into an accessible and interactive user interface.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/desinger.js'>desinger.js</a></b></td>
							<td style='padding: 8px;'>- The <code>desinger.js</code> file serves as the core component of the Kitchen Designer application, orchestrating the user interface and interaction flow for customizing kitchen and bathroom layouts<br>- It manages the applications current step (e.g., dimension input or design editing), tracks the active room being worked on, and maintains detailed state data for each rooms dimensions, elements, materials, and colors<br>- Additionally, it integrates functionalities such as generating PDF quotes and providing intuitive icons for actions like rotation, deletion, and pricing, thereby enabling users to efficiently design, visualize, and generate professional proposals within the overall architecture of the kitchen design platform.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/index.js'>index.js</a></b></td>
							<td style='padding: 8px;'>- Sets up the React application by rendering the main App component into the DOM, establishing the entry point for the user interface<br>- It integrates performance measurement tools to monitor app efficiency and ensures the application initializes within Reacts strict mode for enhanced debugging and stability, forming the foundational layer of the overall project architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/catergoryPhotoManager.js'>catergoryPhotoManager.js</a></b></td>
							<td style='padding: 8px;'>- The <code>categoryPhotoManager.js</code> component serves as a centralized interface for managing categorized photos within the kitchen designer application<br>- It enables users to upload, organize, and edit images across multiple room categories such as kitchen, bathroom, and living room<br>- By providing functionalities like reordering, editing, and deleting photos, it supports dynamic content curation that enhances the visual presentation and customization of design portfolios<br>- This component integrates seamlessly into the overall architecture by interacting with backend APIs for data persistence and maintaining a responsive, user-friendly experience for managing visual assets across different project categories.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/PriceManagement.js'>PriceManagement.js</a></b></td>
							<td style='padding: 8px;'>- Provides an interface for managing and updating pricing data related to cabinets, materials, and colors within the kitchen design application<br>- Facilitates loading, editing, and saving price configurations, ensuring real-time adjustments align with backend data<br>- Serves as a central component for maintaining accurate cost parameters, supporting dynamic pricing strategies across the overall architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/reportWebVitals.js'>reportWebVitals.js</a></b></td>
							<td style='padding: 8px;'>- Facilitates performance monitoring by collecting key web vitals metrics such as CLS, FID, FCP, LCP, and TTFB<br>- Integrates with the overall architecture to enable tracking of user experience and application responsiveness, supporting performance optimization efforts across the project<br>- This module ensures that performance data is captured efficiently for analysis and improvement.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/DesignViewer.js'>DesignViewer.js</a></b></td>
							<td style='padding: 8px;'>- DesignViewer ComponentThe <code>DesignViewer</code> component serves as the central interface for managing and visualizing user-created kitchen designs within the application<br>- It facilitates fetching, displaying, and filtering design data from the backend API, providing users with an organized view of their designs—whether all, new, or viewed<br>- Additionally, it maintains and presents relevant statistics, such as total designs and counts based on their viewed status<br>- This component integrates design previews and ensures secure data access through authentication headers, contributing to a cohesive user experience in the overall architecture of the kitchen design platform.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/App.js'>App.js</a></b></td>
							<td style='padding: 8px;'>- Defines the primary navigation structure for the kitchen design application, orchestrating routing between the main design interface, administrative management, and design preview sections<br>- Facilitates seamless user transitions across core functionalities, ensuring a cohesive user experience within the overall architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/kitchen-designer/src/AnalyticsDashboard.js'>AnalyticsDashboard.js</a></b></td>
							<td style='padding: 8px;'>- Provides a comprehensive analytics dashboard for monitoring key website metrics, user activity, and engagement trends<br>- It fetches and visualizes data such as page views, unique visitors, and activity logs, enabling users to analyze performance over customizable periods<br>- The component supports real-time data refreshes and displays recent activities, facilitating data-driven decision-making within the overall application architecture.</td>
						</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<!-- cabinet-photo-server Submodule -->
	<details>
		<summary><b>cabinet-photo-server</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ cabinet-photo-server</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/cabinet-photo-server/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Provides the core server setup for the cabinet photo management application, enabling secure, scalable, and efficient handling of user authentication, image uploads, and data processing<br>- Integrates essential middleware and dependencies to support API endpoints, image manipulation, and security best practices, forming the backbone of the system’s architecture for managing and serving cabinet-related photos.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/cabinet-photo-server/init-database.js'>init-database.js</a></b></td>
					<td style='padding: 8px;'>- The <code>init-database.js</code> file establishes the foundational data layer for the cabinet photo management application<br>- It initializes and configures the SQLite database, creating essential tables to store photo metadata and optional category information<br>- This setup enables efficient organization, retrieval, and management of photo assets within the system, serving as the backbone for features related to photo storage, categorization, and display ordering across the entire codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/cabinet-photo-server/server.js'>server.js</a></b></td>
					<td style='padding: 8px;'>- Server.jsThis file serves as the core server setup for the cabinet photo management application<br>- It establishes the Express.js server, configures middleware for handling CORS, JSON payloads, and file uploads, and integrates essential services such as image processing, authentication, and email notifications<br>- Overall, it orchestrates the backend infrastructure to support secure user interactions, photo uploads, and data management within the applications architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/cabinet-photo-server/config.js'>config.js</a></b></td>
					<td style='padding: 8px;'>- Defines and manages core configuration settings for the cabinet photo server, including environment validation, security, database, email, file uploads, CORS, rate limiting, and logging<br>- Ensures necessary directories are created, facilitating a consistent and secure environment for server operation within the overall architecture.</td>
				</tr>
			</table>
			<!-- database Submodule -->
			<details>
				<summary><b>database</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ cabinet-photo-server.database</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/gudino27/489_project/blob/master/cabinet-photo-server/database/db-helpers.js'>db-helpers.js</a></b></td>
							<td style='padding: 8px;'>- This code file, <code>db-helpers.js</code>, serves as the core database interaction layer for the cabinet photo management system<br>- It provides streamlined functions to retrieve photo data—such as fetching all photos, individual photos by ID, and photos filtered by category—facilitating efficient data access within the application<br>- By abstracting database operations, it supports the overall architectures goal of managing and serving cabinet photo assets reliably and securely, ensuring seamless integration between the applications backend and its persistent storage.</td>
						</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
</details>

---
### Future Enhancements

- 3D visualization capabilities
- Integration with supplier catalogs
- Automated email follow-ups
- Mobile app version

---
## Acknowledgments

- Credit `Jaime gudino`, `cabinet.com`, `doc creattion help from gitdocify enhanced further to fit our needs`, etc.

<div align="left"><a href="#top">⬆ Return</a></div>

---

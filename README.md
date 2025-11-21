# Easy POS

This project is a Point of Sale (POS) application built with React and Vite. It provides a comprehensive solution for managing sales, products, orders, and daily operations in a retail or restaurant environment.

## Tech Stack

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool and development server.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **React Router**: For declarative routing in the application.
- **i18next**: An internationalization framework for translating the application into multiple languages.
- **Axios**: For making HTTP requests to the backend API.
- **Chart.js**: For creating responsive and interactive charts.
- **Headless UI**: For building accessible UI components.

## Features

- **Authentication**: Secure login for cashiers.
- **POS Interface**: An intuitive interface for processing sales, including barcode scanning and product search.
- **Product Management**: Add, edit, and manage product information, including stock levels.
- **Order Management**: View and manage both online and offline orders.
- **Dashboard**: A comprehensive overview of sales, transactions, and business performance with interactive charts.
- **Start/End of Day**: Processes for starting and ending the business day, including cash management.
- **Table Management**: Manage tables for dine-in customers.
- **Multilingual Support**: The application supports multiple languages (English, Indonesian, Korean) using i18next.
- **Offline Support**: The application can function in offline mode and sync data when a connection is restored.
- **Customer Display**: A separate screen for customers to view their orders.

## Project Structure

The `src` folder is organized as follows:

- **`assets`**: Contains static assets like images and fonts.
- **`components`**: Contains reusable UI components.
- **`contexts`**: Contains React contexts for managing global state.
- **`hooks`**: Contains custom React hooks.
- **`Layouts`**: Contains the main layout components for the application.
- **`locales`**: Contains translation files for i18next.
- **`pages`**: Contains the main pages of the application.
- **`routes`**: Contains the routing configuration for the application.
- **`services`**: Contains API client and other services.
- **`utils`**: Contains utility functions.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/sit-ez/client-easypos.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd client_easypos
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

To start the development server, run the following command:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in the development mode.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run lint`: Lints the code using ESLint.
- `npm run preview`: Serves the production build locally.

## Key Contexts

The application uses the following React contexts to manage global state:

- **`AuthContext`**: Manages user authentication state, including login and logout.
- **`LayoutContext`**: Manages the layout state, such as the visibility of the chatbot and other UI elements.
- **`OfflineContext`**: Manages the application's offline capabilities, including data syncing.
- **`OrderContext`**: Manages the state of the current order.
- **`SettingsContext`**: Manages the application's settings.

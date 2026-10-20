<?php

// Fix Vercel serverless environment path detection:
// Vercel routes all requests to this file (/api/index.php). Without setting SCRIPT_NAME,
// Symfony/Laravel detects the application base URL as '/api' and strips it from the route,
// causing 404 Route Not Found on all API endpoints.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/../public/index.php';

// Early CORS handling for Vercel Serverless
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With, Origin, Application");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require __DIR__ . '/../public/index.php';

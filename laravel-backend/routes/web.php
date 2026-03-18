<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All web routes serve the React SPA via the .htaccess fallback.
| This file is kept minimal as the API handles all backend logic.
|
*/

Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

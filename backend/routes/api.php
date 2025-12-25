<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;

Route::get('/articles',[ArticleController::class,'index']);
Route::get('/articles/{id}',[ArticleController::class,'show']);
Route::get('/articles/{id}/download',[ArticleController::class,'download']);
Route::post('/articles',[ArticleController::class,'store']);
Route::put('/articles/{id}',[ArticleController::class,'update']);
Route::post('/articles/{id}/enhance',[ArticleController::class,'enhance']);
Route::delete('/articles/{id}',[ArticleController::class,'destroy']);
Route::post('/articles/scrape',[ArticleController::class,'scrape']);

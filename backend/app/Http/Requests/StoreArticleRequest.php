<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest {
    public function rules() {
        return [
            'title' => 'required|string',
            'content' => 'required|string'
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContactRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
   public function rules(): array
    {
        return [
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'show_phone' => 'boolean',
            'show_mobile' => 'boolean',
            'show_contact_email' => 'boolean',
            'show_address' => 'boolean',
        ];
    }
}

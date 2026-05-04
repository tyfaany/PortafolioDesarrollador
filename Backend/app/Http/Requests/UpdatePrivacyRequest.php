<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePrivacyRequest extends FormRequest
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
            'show_bio' => 'nullable|boolean',
            'show_studies' => 'nullable|boolean',
            'show_jobs' => 'nullable|boolean',
            'show_skills' => 'nullable|boolean',
            'show_social_links' => 'nullable|boolean',
            'show_profile_photo' => 'nullable|boolean',
            'show_phone' => 'nullable|boolean',
            'show_mobile' => 'nullable|boolean',
            'show_contact_email' => 'nullable|boolean',
            'show_address' => 'nullable|boolean',
        ];
    }
}

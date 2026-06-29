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

    protected function prepareForValidation(): void
    {
        $this->merge([
            'instagram_url' => $this->normalizarUrlExterna($this->input('instagram_url')),
            'facebook_url' => $this->normalizarUrlExterna($this->input('facebook_url')),
        ]);
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
            'instagram_url' => 'nullable|url|max:255',
            'facebook_url' => 'nullable|url|max:255',
            'show_phone' => 'boolean',
            'show_mobile' => 'boolean',
            'show_contact_email' => 'boolean',
            'show_address' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'phone.string' => 'El teléfono debe ser una cadena de texto.',
            'phone.max' => 'El teléfono no puede superar :max caracteres.',
            'mobile.string' => 'El celular debe ser una cadena de texto.',
            'mobile.max' => 'El celular no puede superar :max caracteres.',
            'contact_email.email' => 'El correo de contacto debe ser válido.',
            'contact_email.max' => 'El correo de contacto no puede superar :max caracteres.',
            'address.string' => 'La dirección debe ser una cadena de texto.',
            'address.max' => 'La dirección no puede superar :max caracteres.',
            'instagram_url.url' => 'El enlace de Instagram debe ser una URL válida.',
            'instagram_url.max' => 'El enlace de Instagram no puede superar :max caracteres.',
            'facebook_url.url' => 'El enlace de Facebook debe ser una URL válida.',
            'facebook_url.max' => 'El enlace de Facebook no puede superar :max caracteres.',
            'show_phone.boolean' => 'La visibilidad del teléfono debe ser verdadera o falsa.',
            'show_mobile.boolean' => 'La visibilidad del celular debe ser verdadera o falsa.',
            'show_contact_email.boolean' => 'La visibilidad del correo de contacto debe ser verdadera o falsa.',
            'show_address.boolean' => 'La visibilidad de la dirección debe ser verdadera o falsa.',
        ];
    }

    private function normalizarUrlExterna(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $limpio = trim($value);

        if ($limpio === '') {
            return $limpio;
        }

        if (preg_match('/^[a-z][a-z0-9+.-]*:\/\//i', $limpio) === 1) {
            return $limpio;
        }

        return 'https://' . ltrim($limpio, '/');
    }
}

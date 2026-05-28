<?php

return [
    'accepted' => 'Debes aceptar :attribute.',
    'array' => 'El campo :attribute debe ser un arreglo.',
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'date' => 'El campo :attribute no es una fecha válida.',
    'email' => 'El campo :attribute debe ser una dirección de correo válida.',
    'exists' => 'El valor seleccionado para :attribute no es válido.',
    'image' => 'El campo :attribute debe ser una imagen.',
    'in' => 'El valor seleccionado para :attribute no es válido.',
    'integer' => 'El campo :attribute debe ser un número entero.',
    'max' => [
        'array' => 'El campo :attribute no debe tener más de :max elementos.',
        'file' => 'El campo :attribute no debe ser mayor de :max kilobytes.',
        'numeric' => 'El campo :attribute no debe ser mayor que :max.',
        'string' => 'El campo :attribute no debe ser mayor de :max caracteres.',
    ],
    'min' => [
        'array' => 'El campo :attribute debe tener al menos :min elementos.',
        'file' => 'El campo :attribute debe ser de al menos :min kilobytes.',
        'numeric' => 'El campo :attribute debe ser al menos :min.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
    ],
    'mimes' => 'El campo :attribute debe ser un archivo de tipo: :values.',
    'nullable' => 'El campo :attribute puede ser opcional.',
    'required' => 'El campo :attribute es obligatorio.',
    'required_unless' => 'El campo :attribute es obligatorio cuando :other no es :value.',
    'string' => 'El campo :attribute debe ser una cadena de texto.',
    'url' => 'El campo :attribute debe ser una URL válida.',

    'custom' => [
        'description' => [
            'max' => 'La descripción no debe tener más de :max caracteres.',
            'min' => 'La descripción debe tener al menos :min caracteres.',
        ],
    ],

    'attributes' => [
        'title' => 'título',
        'description' => 'descripción',
        'technologies' => 'tecnologías',
        'technologies.*' => 'tecnología',
        'image' => 'imagen',
        'start_date' => 'fecha de inicio',
        'end_date' => 'fecha de fin',
        'demo_url' => 'URL demo',
        'repo_url' => 'URL del repositorio',
        'is_in_progress' => 'estado en progreso',
        'is_public' => 'visibilidad',
    ],
];

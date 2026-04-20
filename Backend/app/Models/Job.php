<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory;

    protected $table = 'work_experiences';

    /**
     * Campos que permitimos llenar masivamente desde el formulario.
     * Aquí usamos 'position' para el "Puesto o Cargo" y 'achievements' para los "Logros".
     */
    protected $fillable = [
        'user_id',
        'company_name',
        'position',
        'job_title',
        'role',
        'title',
        'cargo',
        'achievements',
        'achievement',
        'achivement',
        'achivements',
        'description',
        'logros',
        'start_month',
        'start_year',
        'end_month',
        'end_year',
        'is_current_job',
    ];

    /**
     * Conversión de tipos. 
     * Esto asegura que 'is_current_job' siempre se trate como un booleano (true/false) 
     * y no como un simple 1 o 0 de la base de datos.
     */
    protected $casts = [
        'is_current_job' => 'boolean',
    ];

    /**
     * Relación Inversa: Un registro laboral pertenece a un Usuario.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

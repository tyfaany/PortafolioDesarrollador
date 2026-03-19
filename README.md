# React + Vite
# portafolioDigial
proyecto taller de ingenieria de software 1-2026

Este proyecto esta construido con [react.jsx] y [Laravel 10](https://laravel.com)
## Requerimientos
Estos son los Requerimientos para trabajar con el Proyecto, asi como el orden para instalarlos.
- Un servidor PHP y MySQL, [Xampp](https://www.apachefriends.org/es/index.html)(Recomendado) 
- La version especifica de PHP 8.2.X
- [Composer](https://getcomposer.org/Composer-Setup.exe)
-[npm](Package Manager de NodeJs)
- Algún editor de texto o IDE, [Visual Studio Code](https://code.visualstudio.com/download) es recomendado

### Instalacion de Xampp
Simplemente es instalar el ejecutable y seguir los pasos. Para instalar  la version especifica solo es descargar la version especifica e instalarla.
### Instalacion de NodeJs
Simplemente es instalar el ejecutable y seguir los pasos.
### Instalacion de Composer
Es necesario tener antes  el Xammp instalados, tambien es instalar el ejecutable y seguir los pasos.

## Ejecucion del Proyecto
Una vez clonado el proyecto, debemos abrir visual studio code y abrir la carpeta del proyecto.
Tenemos dos carpetas para el proyecto:
- **Backend**: Esta carpeta contiene el proyecto de Laravel
- **Frontend**: Esta carpeta contiene el proyecto de React + vite
  
Es necesario saber identificar que el directorio en el que estas es el correcto, antes de Ejecutar los comandos.
Lo recomendable es que tengas dos terminales abiertas, una para el Backend y otra para el Frontend.
Los comandos para navegar entre directorios son:
```
cd <nombre de la carpeta> (para entrar al directorio seleccionado) 
cd .. (para salir del directorio actual e ir atrás)
```
### Ejecucion del Backend


Primero, dentro de la carpeta backend, ejecutamos el siguiente comando:
```
composer install
```

Luego, debemos configurar adecuadamente el archivo .env, para ello, debemos copiar el archivo .env.example y renombrarlo a .env. Normalmente ya deberia poseer todo para correr, lo unico que falta seria la APP_KEY, para ello, ejecutamos el siguiente comando:
```
php artisan key:generate
```
Luego, debemos crear la base de datos, para ello, abrimos el Xampp y nos dirigimos a la opcion de phpMyAdmin, una vez dentro, creamos una base de datos con el nombre que queramos, pero debemos asegurarnos que el nombre de la base de datos sea el mismo que el que pusimos en el archivo .env en la variable DB_DATABASE.


Esto instalará todas las dependencias necesarias para el proyecto.
Luego ejecutamos el siguiente comando:
```
php artisan migrate
```
Esto creará las tablas necesarias para el proyecto, y cada vez que se haga un cambio en las tablas, se debe ejecutar este comando para que se actualicen los cambios.
Si todo esta bien, ejecutamos el siguiente comando:
```
php artisan serve
```
Esto iniciará el servidor de Laravel, y si todo esta bien, deberiamos poder acceder a la pagina de inicio de Laravel, que es la que aparecera en la consola.

### Ejecucion del Frontend
Dentro de la carpeta frontend, ejecutamos el siguiente comando:
```
npm  install
```
Esto instalará todas las dependencias necesarias para el proyecto.
Tambien es necesario crear un archivo llamado .env , que contendrá lo siguiente:
```
VITE_LARAVEL_API_URL=http://127.0.0.1:8000/api
```
Luego ejecutamos el siguiente comando:
```
npm run dev
```
Esto iniciará el servidor de react + vite , y si todo esta bien, deberiamos poder acceder a la pagina de inicio de React + vite ,  además de ver un Backend funcionando en la consola, el cual se obtiene del proyecto del backend.



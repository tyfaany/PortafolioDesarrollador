import { useEffect } from "react";
import api from "./axios/api.js"; // importa tu instancia de Axios

function TestBackend() {
  useEffect(() => {
    api.get("/test") // llama al endpoint de prueba en Laravel
      .then(res => console.log(res.data)) // imprime respuesta en la consola
      .catch(err => console.error(err)); // imprime error si no conecta
  }, []);

  return (
    <div>
      Abre la consola para ver si el backend responde.
    </div>
  );
}

export default TestBackend;
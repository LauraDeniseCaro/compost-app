// vecino.js

// 1. IMPORTAMOS SOLO LO QUE EL VECINO NECESITA (Solo lectura: getDoc y getDocs)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 2. CONFIGURACIÓN DE TU PROYECTO
const firebaseConfig = {
  apiKey: "AIzaSyAZIz4V9XYwdugRzRDVqypViVvIplPZkOw",
  authDomain: "app-compost.firebaseapp.com",
  projectId: "app-compost",
  storageBucket: "app-compost.firebasestorage.app",
  messagingSenderId: "562530186776",
  appId: "1:562530186776:web:ab32fc54df7838036c756d"
};

// 3. INICIALIZAMOS FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. FUNCIÓN: CONSULTAR ESTADÍSTICAS DEL VECINO
window.consultarMisKilos = async function() {
  const dni = document.getElementById('dniVecino').value.trim();
  if (!dni) return alert("Por favor, ingresá tu DNI.");

  try {
    const docRef = doc(db, "vecinos", dni);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const datos = docSnap.data();
      const kilos = datos.totalKilos || 0;

      // Mostramos los datos en la pantalla
      document.getElementById('saludoVecino').innerText = `¡Hola, ${datos.nombre}!`;
      document.getElementById('barrioInfo').innerText = `Vecino de Barrio ${datos.barrio}`;
      document.getElementById('misKilos').innerText = kilos.toFixed(1) + " kg";
      
      // Mensaje motivador según la cantidad de kilos que aportó
      let mensaje = "";
      if (kilos === 0) {
        mensaje = "¡Gracias por sumarte! Traé tu primer balde de orgánicos para empezar a medir tu impacto. 🥑";
      } else if (kilos < 10) {
        mensaje = "¡Buen comienzo! Estás evitando que los gases de efecto invernadero contaminen nuestro suelo de Bariloche. 🍂";
      } else if (kilos < 50) {
        mensaje = "¡Impresionante! Tu compromiso ya se nota en la tierra. ¡Sos un gran guardián de la naturaleza! 🪵✨";
      } else {
        mensaje = "¡Leyenda del Compost! Sos un pilar fundamental para el ambiente de nuestra comunidad. ¡Gracias totales! 🌲🌎";
      }
      
      document.getElementById('mensajeMotivador').innerText = mensaje;
      
      // Hacemos visible el panel con sus kilos
      document.getElementById('panelEstadisticas').style.display = 'block';
    } else {
      alert("El DNI ingresado no figura en el sistema. Asegurate de registrarte con el administrador en la próxima entrega.");
      document.getElementById('panelEstadisticas').style.display = 'none';
    }
  } catch (error) {
    console.error("Error al consultar vecino:", error);
    alert("Hubo un problema al conectar con el servidor.");
  }
};

// 5. FUNCIÓN: MOSTRAR EL TOTAL COMUNITARIO AL VECINO
async function cargarTotalComunidad() {
  try {
    let total = 0;
    const querySnapshot = await getDocs(collection(db, "entregas"));
    
    querySnapshot.forEach((doc) => {
      total += doc.data().kilos;
    });
    
    document.getElementById('totalGlobal').innerText = total.toFixed(1) + " kg";
  } catch (error) {
    console.error("Error al cargar métricas comunitarias:", error);
  }
}

// Se ejecuta apenas abre la página para que vean cuánto va recolectando Bariloche en total
cargarTotalComunidad();
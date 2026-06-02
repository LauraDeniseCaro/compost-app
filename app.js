// app.js

// 1. IMPORTAMOS LAS HERRAMIENTAS DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, updateDoc, increment, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// Variable para guardar el vecino que encontremos en la búsqueda actual
let vecinoActual = null;

// 4. FUNCIÓN: BUSCAR VECINO POR DNI
window.buscarVecino = async function() {
  const dni = document.getElementById('busquedaDni').value.trim();
  if (!dni) return alert("Por favor, ingresá un DNI.");

  try {
    const docRef = doc(db, "vecinos", dni);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      vecinoActual = { id: docSnap.id, ...docSnap.data() };
      
      document.getElementById('nombreVecino').innerText = vecinoActual.nombre;
      document.getElementById('barrioVecino').innerText = "Barrio: " + vecinoActual.barrio;
      document.getElementById('resultadoVecino').style.display = 'block';
    } else {
      alert("El DNI no corresponde a un vecino registrado.");
      document.getElementById('resultadoVecino').style.display = 'none';
    }
  } catch (error) {
    console.error("Error al buscar vecino:", error);
    alert("Hubo un problema al conectar con la base de datos.");
  }
};

// 5. FUNCIÓN: CARGAR KILOS DE COMPOST
window.cargarKilos = async function() {
  const kilosInput = document.getElementById('kilosEntrega').value;
  const kilos = parseFloat(kilosInput);
  
  if (!kilosInput || kilos <= 0) return alert("Por favor, ingresá una cantidad válida de kilos.");
  const dni = vecinoActual.id;

  try {
    await addDoc(collection(db, "entregas"), {
      dni: dni,
      kilos: kilos,
      fecha: serverTimestamp()
    });

    await updateDoc(doc(db, "vecinos", dni), {
      totalKilos: increment(kilos)
    });

    alert(`¡Éxito! Se sumaron ${kilos} kg a ${vecinoActual.nombre}.`);
    
    document.getElementById('resultadoVecino').style.display = 'none';
    document.getElementById('kilosEntrega').value = '';
    document.getElementById('busquedaDni').value = '';
    
    actualizarMetricasGlobales();
  } catch (error) {
    console.error("Error al cargar kilos:", error);
    alert("Hubo un error al guardar los datos.");
  }
};

// 6. FUNCIÓN: REGISTRAR UN NUEVO VECINO DESDE LA APP
window.registrarVecino = async function() {
  const dni = document.getElementById('regDni').value.trim();
  const nombre = document.getElementById('regNombre').value.trim();
  const barrio = document.getElementById('regBarrio').value.trim();

  // Validamos que no dejen campos vacíos
  if (!dni || !nombre || !barrio) {
    return alert("Por favor, completá todos los campos para registrar al vecino.");
  }

  try {
    // Verificamos primero si ese DNI ya existe para no pisar los datos de alguien viejo
    const docRef = doc(db, "vecinos", dni);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return alert("Este DNI ya está registrado a nombre de: " + docSnap.data().nombre);
    }

    // Si el DNI es nuevo, creamos el documento con setDoc usando el DNI como ID único
    await setDoc(doc(db, "vecinos", dni), {
      nombre: nombre,
      barrio: barrio,
      totalKilos: 0 // Arranca en cero patito
    });

    alert(`¡Excelente! ${nombre} fue dado de alta correctamente.`);

    // Limpiamos los casilleros del formulario
    document.getElementById('regDni').value = '';
    document.getElementById('regNombre').value = '';
    document.getElementById('regBarrio').value = '';

  } catch (error) {
    console.error("Error al registrar vecino:", error);
    alert("No se pudo registrar al vecino en la base de datos.");
  }
};

// 7. FUNCIÓN: CALCULAR EL TOTAL GLOBAL DE KILOS
window.actualizarMetricasGlobales = async function() {
  try {
    let total = 0;
    const querySnapshot = await getDocs(collection(db, "entregas"));
    
    querySnapshot.forEach((doc) => {
      total += doc.data().kilos;
    });
    
    document.getElementById('totalGlobal').innerText = total.toFixed(1) + " kg";
  } catch (error) {
    console.error("Error al actualizar métricas:", error);
  }
};

// 8. FUNCIÓN: DESCARGAR REPORTE COMPATIBLE CON EXCEL (CSV)
window.exportarExcel = async function() {
  try {
    const querySnapshot = await getDocs(collection(db, "entregas"));
    if (querySnapshot.empty) return alert("No hay datos para exportar.");

    let csvContent = "data:text/csv;charset=utf-8,\uFEFFFecha,DNI del Vecino,Kilos Entregados\n";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let fText = data.fecha ? data.fecha.toDate().toLocaleDateString('es-AR') : "Sin fecha";
      csvContent += `${fText},${data.dni},${data.kilos}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_compost_bariloche.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error al exportar:", error);
    alert("No se pudo generar el archivo de descarga.");
  }
};

actualizarMetricasGlobales();

// 9. FUNCIÓN: VERIFICACIÓN DE CONTRASEÑA PARA EL ADMIN
window.verificarClave = function() {
  const claveIngresada = document.getElementById('claveAdmin').value;
  const claveCorrecta = "admin"; 

  if (claveIngresada === claveCorrecta) {
    document.getElementById('pantallaBloqueo').style.display = 'none';
  } else {
    alert("Contraseña incorrecta. Acceso denegado.");
    document.getElementById('claveAdmin').value = ''; 
  }
};

// Esto hace que si apretás Enter dentro del cuadro de texto, también intente ingresar
document.getElementById('claveAdmin').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    verificarClave();
  }
});
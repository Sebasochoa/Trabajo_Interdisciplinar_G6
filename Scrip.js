var mapa;
var ubicacion;
var servicioDirecciones;
var renderizadores = {};
var marcadores = {};
var paraderos = {};
var destinoMarcador;
function loadGoogleMaps() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

loadGoogleMaps().then(() => {
    // Aquí puedes llamar a funciones que dependen de initMap
}).catch((error) => {
    console.error('Error al cargar Google Maps:', error);
});

function initMap() {
    mapa = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -16.386904, lng: -71.574997 },
        zoom: 12
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            ubicacion = new google.maps.Marker({
                position: pos,
                map: mapa,
                draggable: true, // Hacer que el marcador sea arrastrable
                title: "Tu ubicación actual"
            });

            mapa.setCenter(pos);
        }, function () {
            handleLocationError(true, mapa);
        });
    } else {
        handleLocationError(false, mapa);
    }
    servicioDirecciones = new google.maps.DirectionsService();
    mapa.addListener('click', function (event) {
        agregarDestino(event.latLng);
    });
    for (const key in Rutas) {
        if (Rutas.hasOwnProperty(key)) {
            const ruta = Rutas[key];
            const [rutaNombre, recorrido] = key.split('_');
            cargarParaderos(ruta.paradas, rutaNombre, ruta.recorrido);
        }
    }
}

function limpiarRutas() {
    // Iterar sobre renderizadores
    Object.keys(renderizadores).forEach(function (ruta) {
        renderizadores[ruta].forEach(function (renderizador) {
            renderizador.setMap(null);
        });
        renderizadores[ruta] = [];
    });

    // Iterar sobre marcadores
    Object.keys(marcadores).forEach(function (ruta) {
        marcadores[ruta].forEach(function (marcador) {
            marcador.setMap(null);
        });
        marcadores[ruta] = [];
    });
}
// Manejo de errores de geolocalización
function handleLocationError(browserHasGeolocation, pos) {
    var infoWindow = new google.maps.InfoWindow({ map: pos }); // Cambiar de map a pos
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}
function agregarDestino(latLng) {
    // Eliminar el marcador existente del destino, si existe
    if (destinoMarcador) {
        destinoMarcador.setMap(null);
    }
    // Crear un marcador para el nuevo destino
    destinoMarcador = new google.maps.Marker({
        position: latLng,
        map: mapa,
        title: 'Destino',
        icon: {
            url: 'destino.png', // URL de la imagen del marcador de destino
            scaledSize: new google.maps.Size(30, 30) // Tamaño del marcador de destino
        }
    });
    limpiarRutas();
    borrarRutas();
    CalcularRutas();
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function addValueToMap(map, key, value) {
    if (!map.has(key)) {
        map.set(key, new Set());
    }
    map.get(key).add(value);
}

function findStops(Position, map) {
    let increment = 0.1;
    let maxDistance = 0.5;
    let found = false;

    while (increment <= maxDistance && !found) {
        for (let ruta in paraderos) {
            if (paraderos.hasOwnProperty(ruta)) {
                paraderos[ruta].forEach((marcador) => {
                    const distance = haversineDistance(Position.lat(), Position.lng(), marcador.parada.lat, marcador.parada.lng);
                    if (distance < increment) {
                        addValueToMap(map, ruta, marcador.id);
                        found = true;
                    }
                });
            }
        }

        if (!found) {
            increment += 0.1;
        }
    }
}

function IsApproaching(Paraderos, Ubicacion, Destino) {
    let DistanciaMin = Infinity;
    let indiceCercanoDest = -1;
    Paraderos.forEach((parada, indice) => {
        const distance = haversineDistance(parada.lat, parada.lng, Destino.lat, Destino.lng);
        if (distance < DistanciaMin) {
            DistanciaMin = distance;
            indiceCercanoDest = indice;
        }
    });
    DistanciaMin = Infinity;
    let indiceCercanoUbi = -1;

    Paraderos.forEach((parada, indice) => {
        const distance = haversineDistance(parada.lat, parada.lng, Ubicacion.lat, Ubicacion.lng);
        if (distance < DistanciaMin) {
            DistanciaMin = distance;
            indiceCercanoUbi = indice;
        }
    });

    if (indiceCercanoDest === -1 || indiceCercanoUbi === -1) {
        return false;
    }

    let result = []

    let lastDistance = Infinity;
    if (indiceCercanoUbi < indiceCercanoDest) {
        for (let i = indiceCercanoUbi; i < indiceCercanoDest; i++) {
            const distance = haversineDistance(Paraderos[i].lat, Paraderos[i].lng, Destino.lat, Destino.lng);
            if (distance > lastDistance) {
                result.push(0);
            }
            else {
                result.push(1);
            }
            lastDistance = distance;
        }
    }
    else {
        return false;
    }
    let countZeros = result.reduce((acc, currentValue) => {
        if (currentValue === 0) {
            acc++;
        }
        return acc;
    }, 0);
    let countOnes = result.reduce((acc, currentValue) => {
        if (currentValue === 1) {
            acc++;
        }
        return acc;
    }, 0);
    if (countOnes > countZeros) {
        return true;
    } else {
        return false;
    }
}



function EraseWay(Objeto, Ubicacion, Destino) {
    const rutaKeys = Object.keys(Objeto);
    const rutaArray = Objeto[rutaKeys[0]];
    const keys = Object.keys(Rutas);
    resultado1 = {};
    resultado2 = {};

    keys.forEach(key => {
        if (key.startsWith(rutaKeys) && key.endsWith(rutaArray[0])) {
            resultado1 = Rutas[key];
        } else if (key.startsWith(rutaKeys) && key.endsWith(rutaArray[1])) {
            resultado2 = Rutas[key];
        }
    });
    if (!IsApproaching(resultado1.paradas, Ubicacion, Destino)) {
        const indexToDelete = Objeto[rutaKeys].indexOf('Ida');
        if (indexToDelete !== -1) {
            Objeto[rutaKeys].splice(indexToDelete, 1);
        }
    } else {
        if (!IsApproaching(resultado2.paradas, Ubicacion, Destino)) {
            const indexToDelete = Objeto[rutaKeys].indexOf('Vuelta');
            if (indexToDelete !== -1) {
                Objeto[rutaKeys].splice(indexToDelete, 1);
            }
        }

    }
}

function GetRoute(nombreRuta, recorrido) {
    const keys = Object.keys(Rutas);
    let resultado = {};

    keys.forEach(key => {
        const [rutaNombre, rutaRecorrido] = key.split('_');
        if (rutaNombre === nombreRuta && rutaRecorrido === recorrido) {
            resultado = Rutas[key];
        }
    });

    return resultado;
}

function GetNearStop(Paraderos, Coordenadas) {
    let DistanciaMin = Infinity;
    let result;
    Paraderos.forEach((parada) => {
        const distance = haversineDistance(parada.lat, parada.lng, Coordenadas.lat, Coordenadas.lng);
        if (distance < DistanciaMin) {
            DistanciaMin = distance;
            result = { lat: parada.lat, lng: parada.lng };
        }
    });
    return result;
}

function ChooseRoute(Objeto, Ubicacion, Destino) {
    const rutaKeys = Object.entries(Objeto);

    for (let ruta in rutaKeys) {
        let [rutaNombre, rutaArray] = rutaKeys[ruta];
        if (rutaArray.length > 1) {
            let DobleRecorrido = {};
            DobleRecorrido[rutaNombre] = rutaArray;
            EraseWay(DobleRecorrido, Ubicacion, Destino);
        }
        let objetoruta = GetRoute(rutaNombre, rutaArray[0]);
        if (!IsApproaching(objetoruta.paradas, Ubicacion, Destino)) {
           delete Objeto[rutaNombre];
        }
    }
}

function CalcularRutas() {
    if (destinoMarcador && ubicacion) {
        let posicionDestino = destinoMarcador.getPosition();
        let posicionInicial = ubicacion.getPosition();
        let rutasCercanasADestino = new Map();
        let rutasCercanasAUbicacion = new Map();

        // Buscar paraderos cercanos a la posición del destinoMarcador
        findStops(posicionDestino, rutasCercanasADestino);

        // Buscar paraderos cercanos a la ubicación inicial
        findStops(posicionInicial, rutasCercanasAUbicacion);

        if (rutasCercanasADestino.size !== 0 && rutasCercanasAUbicacion.size !== 0) {
            let result = containsAny(rutasCercanasAUbicacion, rutasCercanasADestino);

            if (result !== null) {
                const rutaKeys = Object.keys(result);
                const rutaArray = result[rutaKeys[0]];

                if (Array.isArray(rutaKeys)) {
                    ChooseRoute(result, { lat: posicionInicial.lat(), lng: posicionInicial.lng() }, { lat: posicionDestino.lat(), lng: posicionDestino.lng() });
                }
                
                if (Array.isArray(rutaArray) && rutaArray.length > 1) {
                    EraseWay(result, { lat: posicionInicial.lat(), lng: posicionInicial.lng() }, { lat: posicionDestino.lat(), lng: posicionDestino.lng() });
                }

                const RutaASeguir = GetRoute(rutaKeys[0], rutaArray[0]);
                const { paradas } = RutaASeguir;

                let minDistanciaUbicacion = Infinity;
                let minDistanciaDestino = Infinity;
                let paraderoUbicacion;
                let paraderoDestino;

                paradas.forEach((coordenada) => {
                    let distanciaUbicacion = haversineDistance(coordenada.lat, coordenada.lng, posicionInicial.lat(), posicionInicial.lng());
                    let distanciaDestino = haversineDistance(coordenada.lat, coordenada.lng, posicionDestino.lat(), posicionDestino.lng());
                    if (distanciaUbicacion < minDistanciaUbicacion) {
                        minDistanciaUbicacion = distanciaUbicacion;
                        paraderoUbicacion = coordenada;
                    }
                    if (distanciaDestino < minDistanciaDestino) {
                        minDistanciaDestino = distanciaDestino;
                        paraderoDestino = coordenada;
                    }
                });
                mostrarRutapersonalizada(RutaASeguir.solicitud, 'green', RutaASeguir.nombre, paraderoUbicacion, paraderoDestino);
            }
            else {
                console.log(rutasCercanasAUbicacion);
                console.log(rutasCercanasADestino);

                let distanciamascorta = Infinity;
                let RutaASeguir1;
                let RutaASeguir2;
                let paraderoIntermedio1;
                let paraderoIntermedio2;
                rutasCercanasAUbicacion.forEach((setUbicacion, rutaubicacion) => {
                    rutasCercanasADestino.forEach((setDestino, rutadestino) => {
                        let recorridoubicacion = rutasCercanasAUbicacion.get(rutaubicacion);
                        let recorridodestino = rutasCercanasADestino.get(rutadestino);
                        for (let recorridoU of recorridoubicacion) {
                            let objetoUbicacion = GetRoute(rutaubicacion, recorridoU);
                            const paradasU = objetoUbicacion.paradas;
                            for (let recorridoD of recorridodestino) {
                                let objetoDestino = GetRoute(rutadestino, recorridoD);
                                const paradasD = objetoDestino.paradas;
                                paradasU.forEach((paradaU) => {
                                    paradasD.forEach((paradaD) => {
                                        const distanciaEntreParaderos = haversineDistance(paradaU.lat, paradaU.lng, paradaD.lat, paradaD.lng);
                                        if ((distanciaEntreParaderos < distanciamascorta) && (IsApproaching(paradasU, { lat: posicionInicial.lat(), lng: posicionInicial.lng() }, { lat: paradaU.lat, lng: paradaU.lng })) && (IsApproaching(paradasD, { lat: paradaD.lat, lng: paradaD.lng }, { lat: posicionDestino.lat(), lng: posicionDestino.lng() }))) {
                                            distanciamascorta = distanciaEntreParaderos;
                                            RutaASeguir1 = objetoUbicacion;
                                            RutaASeguir2 = objetoDestino;
                                            paraderoIntermedio1 = { lat: paradaU.lat, lng: paradaU.lng };
                                            paraderoIntermedio2 = { lat: paradaD.lat, lng: paradaD.lng }
                                        }
                                    });
                                });
                            }
                        }

                    });
                });
                ShowCompleteRoute(RutaASeguir1, RutaASeguir2, paraderoIntermedio1, paraderoIntermedio2);

            }
        }
        else {
            const rutaNombreContainer = document.getElementById('ruta-nombre-container');

            const rutaNombreElement = document.createElement('p');
            let nuevaRutaText = 'No se puede calcular un Ruta desde tu Ubicacion hacia tu Destino';

            rutaNombreElement.textContent = nuevaRutaText;
            rutaNombreContainer.appendChild(rutaNombreElement);

        }
    }
}

function ShowCompleteRoute(Solicitud1, Solicitud2, ParaderoIntermedio1, ParaderoIntermedio2) {
    let posicionDestino = destinoMarcador.getPosition();
    let posicionInicial = ubicacion.getPosition();

    let paraderoinicial = GetNearStop(Solicitud1.paradas, { lat: posicionInicial.lat(), lng: posicionInicial.lng() });
    let paraderofinal = GetNearStop(Solicitud2.paradas, { lat: posicionDestino.lat(), lng: posicionDestino.lng() });

    mostrarrutacaminando(Solicitud1.nombre, paraderoinicial, paraderofinal);

    //mostrarrutacaminando(Solicitud2.nombre, paraderofinal, { lat: posicionDestino.lat(), lng: posicionDestino.lng() });

    mostrarRutapersonalizada(Solicitud1.solicitud, 'green', Solicitud1.nombre, paraderoinicial, ParaderoIntermedio1);
    mostrarRutapersonalizada(Solicitud2.solicitud, 'blue', Solicitud2.nombre, ParaderoIntermedio2, paraderofinal);
}

function mostrarRutapersonalizada(solicitud, color, nombreRuta, paraderoinicio, paraderofinal) {
    if (!renderizadores[nombreRuta]) {
        renderizadores[nombreRuta] = [];
    }

    if (!marcadores[nombreRuta]) {
        marcadores[nombreRuta] = [];
    }

    var renderizador = new google.maps.DirectionsRenderer({
        polylineOptions: {
            strokeColor: color
        },
        suppressMarkers: true
    });
    console.log(solicitud);
    let nuevasolicitud = modificarsolicitud(solicitud, paraderoinicio, paraderofinal);
    console.log(nuevasolicitud);
    renderizador.setMap(mapa);
    servicioDirecciones.route(nuevasolicitud, function (resultado, estado) {
        if (estado === 'OK') {
            renderizador.setDirections(resultado);
            marcadores[nombreRuta].push(createMarker({ lat: paraderoinicio.lat, lng: paraderoinicio.lng }, color));
            marcadores[nombreRuta].push(createMarker({ lat: paraderofinal.lat, lng: paraderofinal.lng }, color));
        } else {
            window.alert('Error al obtener la ruta: ' + estado);
        }
    });
    renderizadores[nombreRuta].push(renderizador); // Almacenar el renderizador en el array de la ruta

    let calleinicio = null;
    let callefinal = null
    async function obtenerYAlmacenarNombreCalle() {
        try {
            calleinicio = await obtenerNombreCalle(paraderoinicio.lat, paraderoinicio.lng);
            callefinal = await obtenerNombreCalle(paraderofinal.lat, paraderofinal.lng);
            mostrarNombreRutaEnInterfaz(nombreRuta, calleinicio, callefinal);
        } catch (error) {
            console.error('Error al obtener el nombre de la calle:', error);
        }
    }
    obtenerYAlmacenarNombreCalle().then(() => { });
}


function isCloserToStartorEnd(Solicitud, ParaderoInicio) {
    let inicioruta = Solicitud.origin;
    let finalruta = Solicitud.destination;
    if (haversineDistance(inicioruta.lat, inicioruta.lng, ParaderoInicio.lat, ParaderoInicio.lng) < haversineDistance(finalruta.lat, finalruta.lng, ParaderoInicio.lat, ParaderoInicio.lng)) {
        return true;
    }
    return false;
}

function containsAny(mapA, mapB) {
    let result = {};

    for (let [key, setB] of mapB) {
        if (mapA.has(key)) {
            let setA = mapA.get(key);
            for (let elem of setB) {
                if (setA.has(elem)) {
                    if (!result[key]) {
                        result[key] = [];
                    }
                    result[key].push(elem);
                }
            }
        }
    }

    if (Object.keys(result).length !== 0) {
        return result;
    } else {
        return null;
    }
}


function filterWaypints(Waypoints, Referencia, Posteriores) {
    let indiceCercano = -1;
    let minDistancia = Infinity;

    Waypoints.forEach((wp, indice) => {
        const distancia = haversineDistance(Referencia.lat, Referencia.lng, wp.location.lat, wp.location.lng);
        if (distancia < minDistancia) {
            minDistancia = distancia;
            indiceCercano = indice;
        }
    });

    let waypointsFiltrados;
    if (Posteriores) {
        waypointsFiltrados = Waypoints.slice(0, indiceCercano);
    } else {
        waypointsFiltrados = Waypoints.slice(indiceCercano);
    }

    return waypointsFiltrados;
}

function modificarsolicitud(solicitud, paraderoinicio, paraderofinal) {
    let nuevoswaypoints = [];
    nuevoswaypoints = filterWaypints(solicitud.waypoints, paraderoinicio, false);
    nuevoswaypoints = filterWaypints(nuevoswaypoints, paraderofinal, true);

    let nuevasolicitud = {
        origin: paraderoinicio,
        destination: paraderofinal,
        travelMode: solicitud.travelMode,
        waypoints: nuevoswaypoints
    };

    return nuevasolicitud;
}

function mostrarrutacaminando(nombreRuta, paraderoinicio, paraderofinal) {
    if (!renderizadores[nombreRuta]) {
        renderizadores[nombreRuta] = [];
    }

    let solicitudInicio = {
        origin: { lat: ubicacion.getPosition().lat(), lng: ubicacion.getPosition().lng() },
        destination: { lat: paraderoinicio.lat, lng: paraderoinicio.lng },
        travelMode: 'WALKING'
    };
    var renderizadorInicio = new google.maps.DirectionsRenderer({
        polylineOptions: {
            strokeColor: 'red'
        },
        suppressMarkers: true
    });

    renderizadorInicio.setMap(mapa);
    servicioDirecciones.route(solicitudInicio, function (resultado, estado) {
        if (estado === 'OK') {
            renderizadorInicio.setDirections(resultado);
            //marcadores[nombreRuta].push(createMarker(coordenadasIniciales));
        } else {
            window.alert('Error al obtener la ruta de inicio: ' + estado);
        }
    });
    renderizadores[nombreRuta].push(renderizadorInicio); // Almacenar el renderizador en el array de la ruta

    // Solicitud 'walking' desde paraderofinal hasta coordenadasFinales
    let solicitudFinal = {
        origin: { lat: paraderofinal.lat, lng: paraderofinal.lng },
        destination: { lat: destinoMarcador.getPosition().lat(), lng: destinoMarcador.getPosition().lng() },
        travelMode: 'WALKING'
    };

    var renderizadorFinal = new google.maps.DirectionsRenderer({
        polylineOptions: {
            strokeColor: 'red'
        },
        suppressMarkers: true
    });

    renderizadorFinal.setMap(mapa);
    servicioDirecciones.route(solicitudFinal, function (resultado, estado) {
        if (estado === 'OK') {
            renderizadorFinal.setDirections(resultado);
            //marcadores[nombreRuta].push(createMarker(coordenadasFinales));
        } else {
            window.alert('Error al obtener la ruta final: ' + estado);
        }
    });
    renderizadores[nombreRuta].push(renderizadorFinal);
}

function mostrarNombreRutaEnInterfaz(nombreRuta, streetName1, streetName2) {
    let rutaAmostrar = null;
    switch (nombreRuta) {
        case 'Ruta1':
            rutaAmostrar = 'Dolores San Martin ';
            break;
        case 'Ruta2':
            rutaAmostrar = 'COTUM A';
            break;
        case 'Ruta3':
            rutaAmostrar = ' A15-Miraflores';
            break;
        case 'Ruta4':
            rutaAmostrar = 'Alto Selva Alegre';
            break;
        case 'Ruta5':
            rutaAmostrar = 'C2-4D(Cono Norte)';
            break;
        case 'Ruta6':
            rutaAmostrar = 'BJUANXXIII';
            break;
        case 'Ruta7':
            rutaAmostrar = 'C11 COTUM B ';
            break;
        case 'Ruta8':
            rutaAmostrar = 'C7-5 AQP Masivo Alto Libertad ';
            break;
        case 'Ruta9':
            rutaAmostrar = 'C - 3 de octubre';
            break;
        case 'Ruta10':
            rutaAmostrar = 'C7 AqpMasivo 7-09';
            break;
        case 'Ruta11':
            rutaAmostrar = 'A-Mariano Melgar';
            break;
        case 'Ruta12':
            rutaAmostrar = 'B-Polanco';
            break;
        case 'Ruta13':
            rutaAmostrar = 'B - 3 de octubre';
            break;
        case 'Ruta14':
            rutaAmostrar = 'Cayma Enace';
            break;
        case 'Ruta15':
            rutaAmostrar = 'La Perla S.R.L.T.D.A';
            break;
        case 'Ruta16':
            rutaAmostrar = '15 de agosto';
            break;
        case 'Ruta17':
            rutaAmostrar = 'ORIOL - A';
            break;
        case 'Ruta18':
            rutaAmostrar = 'Uchumayo';
            break;
        default:
            break;
    }
    const rutaNombreContainer = document.getElementById('ruta-nombre-container');

    // Crear un nuevo elemento de párrafo para la nueva información
    const rutaNombreElement = document.createElement('p');
    let nuevaRutaText = '';

    if (!streetName1 && streetName2) {
        nuevaRutaText = `Debes tomar la ruta ${rutaAmostrar} y bajarte en ${streetName2}`;
    } else if (streetName1 && !streetName2) {
        nuevaRutaText = `Debes ir a ${streetName1} tomar la ruta ${rutaAmostrar}`;
    } else {
        nuevaRutaText = `Debes ir a ${streetName1} tomar la ruta ${rutaAmostrar} y bajarte en ${streetName2}`;
    }

    if (rutaNombreContainer.children.length > 0) {
        // Concatenar el nuevo texto con el texto existente
        let ultimoElemento = rutaNombreContainer.lastElementChild;
        ultimoElemento.textContent += ' luego ' + nuevaRutaText;
    } else {
        rutaNombreElement.textContent = nuevaRutaText;
        rutaNombreContainer.appendChild(rutaNombreElement);
    }
}


// Función para obtener el nombre de la calle a partir de coordenadas
function obtenerNombreCalle(lat, lng) {
    return new Promise((resolve, reject) => {
        var geocoder = new google.maps.Geocoder();
        var latLng = new google.maps.LatLng(lat, lng);

        geocoder.geocode({ 'location': latLng }, function (results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    var addressComponents = results[0].address_components;
                    var streetName = "";

                    for (var i = 0; i < addressComponents.length; i++) {
                        if (addressComponents[i].types.includes("route")) {
                            streetName = addressComponents[i].long_name;
                            break;
                        }
                    }

                    if (streetName) {
                        resolve(streetName);
                    } else {
                        //reject('No se encontró el nombre de la calle');
                        resolve("");
                    }
                } else {
                    reject('No se encontraron resultados');
                }
            } else {
                reject('Geocoder falló debido a: ' + status);
            }
        });
    });
}

function borrarRutas() {
    const rutaNombreContainer = document.getElementById('ruta-nombre-container');
    rutaNombreContainer.innerHTML = ''; // Borra todo el contenido del contenedor
}


// Función para mostrar el nombre de la ruta en la interfaz


function cargarParaderos(paradasAutobus, ruta, recorrido) {
    if (!paraderos[ruta]) {
        paraderos[ruta] = [];
    }

    paradasAutobus.forEach(function (parada) {
        var marcador = {
            id: recorrido,
            parada: parada
        }
        paraderos[ruta].push(marcador); // Almacenar el marcador en el array de la ruta
    });
}

function cambiarColorSVG(svgString, color) {
    // Crear un elemento div temporal para manipular el SVG como DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgString.trim(); // Eliminar espacios en blanco al inicio y final

    // Obtener todos los elementos path dentro del SVG
    const pathElements = tempDiv.querySelectorAll('path');

    // Iterar sobre cada path y aplicar el color al atributo fill o stroke
    pathElements.forEach(pathElement => {
        const originalFill = pathElement.getAttribute('fill');
        const originalStroke = pathElement.getAttribute('stroke');

        // Modificar fill si tiene el color original, o establecer el nuevo color si está en blanco o nulo
        if (originalFill === '#FFFFFF' || !originalFill) {
            pathElement.setAttribute('fill', color);
        }

        // Modificar stroke si tiene el color original, o establecer el nuevo color si está en blanco o nulo
        if (originalStroke === '#FFFFFF' || !originalStroke) {
            pathElement.setAttribute('stroke', color);
        }
    });

    // Convertir el SVG modificado a una cadena de datos (data URI)
    const svgData = new XMLSerializer().serializeToString(tempDiv.firstChild);
    const svgEncoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

    // Devolver el SVG modificado como una URL de datos
    return svgEncoded;
}


// Ejemplo de uso:
const svgOriginal = `

<svg version="1.1" id="svg8" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
<style type="text/css">
	.st0{}
	.st1{fill:none;stroke:#FFFFFF;stroke-width:6.5922;stroke-miterlimit:10;}
	.st2{fill:#FFFFFF;}
</style>
<path class="st0" d="M96.6,50c0,25.8-20.9,46.7-46.6,46.7C24.3,96.7,3.4,75.8,3.4,50C3.4,24.2,24.3,3.3,50,3.3
	C75.7,3.3,96.6,24.2,96.6,50"/>
<path class="st1" d="M96.6,50c0,25.8-20.9,46.7-46.6,46.7C24.3,96.7,3.4,75.8,3.4,50C3.4,24.2,24.3,3.3,50,3.3
	C75.7,3.3,96.6,24.2,96.6,50"/>
<path class="st2" d="M24.5,37.9V46c0,1.5,1.2,2.7,2.7,2.7V35.2C25.7,35.2,24.5,36.4,24.5,37.9"/>
<path class="st2" d="M72.8,35.2v13.4c1.5,0,2.7-1.2,2.7-2.7v-8.1C75.5,36.4,74.3,35.2,72.8,35.2"/>
<path class="st2" d="M62.1,24.5H37.9c-4.4,0-8,3.6-8,8.1v32.2c0,2,1.1,3.7,2.7,4.6v2.1c0,2.2,1.8,4,4,4c2.2,0,4-1.8,4-4v-1.3h18.8
	v1.3c0,2.2,1.8,4,4,4c2.2,0,4-1.8,4-4v-2.1c1.6-0.9,2.7-2.7,2.7-4.6V32.5C70.1,28.1,66.5,24.5,62.1,24.5 M46,27.2H54
	c1.5,0,2.7,0.6,2.7,1.3s-1.2,1.3-2.7,1.3H46c-1.5,0-2.7-0.6-2.7-1.3S44.5,27.2,46,27.2 M35.2,64.8c-1.5,0-2.7-1.2-2.7-2.7
	c0-1.5,1.2-2.7,2.7-2.7c1.5,0,2.7,1.2,2.7,2.7C37.9,63.6,36.7,64.8,35.2,64.8 M64.8,64.8c-1.5,0-2.7-1.2-2.7-2.7
	c0-1.5,1.2-2.7,2.7-2.7c1.5,0,2.7,1.2,2.7,2.7C67.4,63.6,66.2,64.8,64.8,64.8 M67.4,54c0,1.5-1.2,2.7-2.7,2.7H35.2
	c-1.5,0-2.7-1.2-2.7-2.7V35.2c0-1.5,1.2-2.7,2.7-2.7h29.5c1.5,0,2.7,1.2,2.7,2.7V54z"/>
</svg>
  `;




function createMarker(parada, color) {
    let icon = cambiarColorSVG(svgOriginal, color)
    return new google.maps.Marker({
        position: parada,
        map: mapa,
        title: 'Parada de Autobus',
        icon: {
            url: icon,
            scaledSize: new google.maps.Size(25, 30)
        }
    });
}

var Rutas = {
    Ruta1_Ida: {
        solicitud: {
            origin: { lat: -16.386904, lng: -71.574997 },
            destination: { lat: -16.430473, lng: -71.532604 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.394060, lng: -71.574582 }, stopover: true },
                { location: { lat: -16.397709, lng: -71.575106 }, stopover: true },
                { location: { lat: -16.402060, lng: -71.573212 }, stopover: true },
                { location: { lat: -16.403633, lng: -71.568295 }, stopover: true },
                { location: { lat: -16.400530, lng: -71.569282 }, stopover: true },
                { location: { lat: -16.398183, lng: -71.570091 }, stopover: true },
                { location: { lat: -16.394114, lng: -71.568495 }, stopover: true },
                { location: { lat: -16.390809, lng: -71.567340 }, stopover: true },
                { location: { lat: -16.392139, lng: -71.566163 }, stopover: true },
                { location: { lat: -16.391384, lng: -71.553825 }, stopover: true },
                { location: { lat: -16.389470, lng: -71.555201 }, stopover: true },
                { location: { lat: -16.386548, lng: -71.553867 }, stopover: true },
                { location: { lat: -16.396410, lng: -71.540773 }, stopover: true },
                { location: { lat: -16.392623, lng: -71.537324 }, stopover: true },
                { location: { lat: -16.391799, lng: -71.530726 }, stopover: true },
                { location: { lat: -16.395371, lng: -71.531273 }, stopover: true },
                { location: { lat: -16.395505, lng: -71.527379 }, stopover: true },
                { location: { lat: -16.399560, lng: -71.521542 }, stopover: true },
                { location: { lat: -16.403440, lng: -71.516403 }, stopover: true },
                { location: { lat: -16.415599, lng: -71.515250 }, stopover: true },
                { location: { lat: -16.420330, lng: -71.516615 }, stopover: true },
                { location: { lat: -16.425661, lng: -71.515024 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.389402, lng: -71.574932 },
            { lat: -16.397699, lng: -71.575094 },
            { lat: -16.399962, lng: -71.5705972 },
            { lat: -16.393322, lng: -71.5682076 },
            { lat: -16.392831, lng: -71.560260 },
            { lat: -16.392922, lng: -71.557525 },
            { lat: -16.388102, lng: -71.5520456 },
            { lat: -16.389097, lng: -71.549339 },
            { lat: -16.390184, lng: -71.546413 },
            { lat: -16.392248, lng: -71.540735 },
            { lat: -16.393023, lng: -71.536599 },
            { lat: -16.393349, lng: -71.535529 },
            { lat: -16.391902, lng: -71.5324266 },
            { lat: -16.394210, lng: -71.530851 },
            { lat: -16.399398, lng: -71.52179080 },
            { lat: -16.402912, lng: -71.516663 },
            { lat: -16.415587, lng: -71.515251 },
            { lat: -16.425626, lng: -71.514997 },
            { lat: -16.430518, lng: -71.532659 },
            { lat: -16.429032, lng: -71.523981 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta1'
    },

    Ruta1_Vuelta: {
        solicitud: {
            origin: { lat: -16.430473, lng: -71.532604 },
            destination: { lat: -16.386904, lng: -71.574997 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.427124, lng: -71.53295 }, stopover: true },
                { location: { lat: -16.424925, lng: -71.53309 }, stopover: true },
                { location: { lat: -16.415159, lng: -71.534055 }, stopover: true },
                { location: { lat: -16.412611, lng: -71.53509 }, stopover: true },
                { location: { lat: -16.407767, lng: -71.538579 }, stopover: true },
                { location: { lat: -16.405729, lng: -71.540011 }, stopover: true },
                { location: { lat: -16.399908, lng: -71.542117 }, stopover: true },
                { location: { lat: -16.396656, lng: -71.54519 }, stopover: true },
                { location: { lat: -16.395530, lng: -71.545978 }, stopover: true },
                { location: { lat: -16.395264, lng: -71.54820 }, stopover: true },
                { location: { lat: -16.393445, lng: -71.54907 }, stopover: true },
                { location: { lat: -16.389840, lng: -71.547613 }, stopover: true },
                { location: { lat: -16.390184, lng: -71.54641 }, stopover: true },
                { location: { lat: -16.389097, lng: -71.54933 }, stopover: true },
                { location: { lat: -16.388102, lng: -71.552045 }, stopover: true },
                { location: { lat: -16.392710, lng: -71.55694 }, stopover: true },
                { location: { lat: -16.392772, lng: -71.560269 }, stopover: true },
                { location: { lat: -16.393322, lng: -71.568207 }, stopover: true },
                { location: { lat: -16.399962, lng: -71.570597 }, stopover: true },
                { location: { lat: -16.397699, lng: -71.57509 }, stopover: true },
            ]
        },
        paradas: [
            { lat: -16.427124, lng: -71.532956 },
            { lat: -16.424925, lng: -71.533091 },
            { lat: -16.415382, lng: -71.533968 },
            { lat: -16.412611, lng: -71.535092 },
            { lat: -16.407767, lng: -71.5385793 },
            { lat: -16.405729, lng: -71.5400113 },//
            { lat: -16.398130, lng: -71.541560 },
            { lat: -16.396656, lng: -71.545194 },
            { lat: -16.395511, lng: -71.548082 },
            { lat: -16.393473, lng: -71.549057 },
            { lat: -16.389840, lng: -71.5476133 },
            { lat: -16.390184, lng: -71.546413 },
            { lat: -16.389097, lng: -71.549339 },
            { lat: -16.388102, lng: -71.5520456 },
            { lat: -16.392922, lng: -71.557525 },
            { lat: -16.392831, lng: -71.560260 },
            { lat: -16.393322, lng: -71.5682076 },
            { lat: -16.399962, lng: -71.5705972 },
            { lat: -16.397699, lng: -71.575094 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta1'
    },

    Ruta2_Ida: {
        solicitud: {
            origin: { lat: -16.456477, lng: -71.521933 },
            destination: { lat: -16.40437, lng: -71.53169 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.457903, lng: -71.523766 }, stopover: true },
                { location: { lat: -16.460708, lng: -71.525649 }, stopover: true },
                { location: { lat: -16.452453, lng: -71.531058 }, stopover: true },
                { location: { lat: -16.450702, lng: -71.533197 }, stopover: true },
                { location: { lat: -16.442026, lng: -71.528828 }, stopover: true },
                { location: { lat: -16.440884, lng: -71.525574 }, stopover: true },
                { location: { lat: -16.439259, lng: -71.521772 }, stopover: true },
                { location: { lat: -16.436103, lng: -71.521443 }, stopover: true },
                { location: { lat: -16.432944, lng: -71.522624 }, stopover: true },
                { location: { lat: -16.429245, lng: -71.523600 }, stopover: true },
                { location: { lat: -16.427194, lng: -71.518024 }, stopover: true },
                { location: { lat: -16.425749, lng: -71.514817 }, stopover: true },
                { location: { lat: -16.419447, lng: -71.516917 }, stopover: true },
                { location: { lat: -16.417841, lng: -71.517824 }, stopover: true },
                { location: { lat: -16.411135, lng: -71.521609 }, stopover: true },
                { location: { lat: -16.407074, lng: -71.524615 }, stopover: true },
                { location: { lat: -16.404404, lng: -71.527439 }, stopover: true },
                { location: { lat: -16.405536, lng: -71.528936 }, stopover: true }]
        },
        paradas: [
            { lat: -16.4570573, lng: -71.5223249 },
            { lat: -16.458569, lng: -71.524642 },
            { lat: -16.4607272, lng: -71.5256613 },
            { lat: -16.4528158, lng: -71.5308454 },
            { lat: -16.4524301, lng: -71.5310445 },
            { lat: -16.4514940, lng: -71.5326804 },
            { lat: -16.4420174, lng: -71.5288459 },
            { lat: -16.4408628, lng: -71.5256035 },
            { lat: -16.4362030, lng: -71.5213791 },
            { lat: -16.4328161, lng: -71.5226720 },
            { lat: -16.4290323, lng: -71.5239812 },
            { lat: -16.4280545, lng: -71.5205657 },
            { lat: -16.427238, lng: -71.518504 },
            { lat: -16.4256164, lng: -71.5150012 },
            { lat: -16.4199181, lng: -71.5166529 },
            { lat: -16.411754, lng: -71.520987 },
            { lat: -16.4074799, lng: -71.5243760 },
            { lat: -16.4043556, lng: -71.5273757 },
            { lat: -16.4055383, lng: -71.5289800 },
            { lat: -16.4043591, lng: -71.5316857 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta2'
    },

    Ruta2_Vuelta: {
        solicitud: {
            origin: { lat: -16.40174901915841, lng: -71.5284574981898 },
            destination: { lat: -16.456909628583897, lng: -71.52180673659531 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.4019547, lng: -71.5244612 }, stopover: true },
                { location: { lat: -16.3995340, lng: -71.5216220 }, stopover: true },
                { location: { lat: -16.4029770, lng: -71.5165610 }, stopover: true },
                { location: { lat: -16.4090271, lng: -71.5140228 }, stopover: true },
                { location: { lat: -16.4161833, lng: -71.5154616 }, stopover: true },
                { location: { lat: -16.4225393, lng: -71.5163514 }, stopover: true },
                { location: { lat: -16.4256611, lng: -71.5149821 }, stopover: true },
                { location: { lat: -16.4290779, lng: -71.5238141 }, stopover: true },
                { location: { lat: -16.4362268, lng: -71.5216008 }, stopover: true },
                { location: { lat: -16.4374914, lng: -71.5238378 }, stopover: true },
                { location: { lat: -16.4391442, lng: -71.5224774 }, stopover: true },
                { location: { lat: -16.4406733, lng: -71.5251347 }, stopover: true },
                { location: { lat: -16.4419764, lng: -71.5290164 }, stopover: true },
                { location: { lat: -16.4484694, lng: -71.5329188 }, stopover: true },
                { location: { lat: -16.4524959, lng: -71.5310954 }, stopover: true },
                { location: { lat: -16.4614312, lng: -71.5264002 }, stopover: true },
                { location: { lat: -16.4581001, lng: -71.5238674 }, stopover: true },
                { location: { lat: -16.4575880, lng: -71.5227140 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.4025960, lng: -71.5294669 },
            { lat: -16.4000222, lng: -71.5263101 },
            { lat: -16.4019549, lng: -71.5245644 },
            { lat: -16.3995393, lng: -71.5216156 },
            { lat: -16.4029129, lng: -71.5166635 },
            { lat: -16.4105247, lng: -71.5133695 },
            { lat: -16.4155878, lng: -71.5152515 },
            { lat: -16.4199181, lng: -71.5166529 },
            { lat: -16.4227758, lng: -71.5162115 },
            { lat: -16.4256164, lng: -71.5150012 },
            { lat: -16.427173, lng: -71.518838 },
            { lat: -16.4280545, lng: -71.5205657 },
            { lat: -16.4288914, lng: -71.5236820 },
            { lat: -16.4328161, lng: -71.5226720 },
            { lat: -16.4362030, lng: -71.5213791 },
            { lat: -16.439216, lng: -71.521789 },
            { lat: -16.438675, lng: -71.525534 },
            { lat: -16.4408628, lng: -71.5256035 },
            { lat: -16.4482143, lng: -71.5326327 },
            { lat: -16.458569, lng: -71.524642 },
            { lat: -16.4570573, lng: -71.5223249 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta2'
    },

    Ruta3_Ida: {
        solicitud: {
            origin: { lat: -16.3768449651962, lng: -71.49896209011759 },
            destination: { lat: -16.399557, lng: -71.528701 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.3755235, lng: -71.4997374 }, stopover: true },
                { location: { lat: -16.3736312, lng: -71.5012127 }, stopover: true },
                { location: { lat: -16.3736940, lng: -71.5021350 }, stopover: true },
                { location: { lat: -16.3730350, lng: -71.5028740 }, stopover: true },
                { location: { lat: -16.3742290, lng: -71.5044920 }, stopover: true },
                { location: { lat: -16.3758010, lng: -71.5068630 }, stopover: true },
                { location: { lat: -16.3770044, lng: -71.5086281 }, stopover: true },
                { location: { lat: -16.3799546, lng: -71.5095353 }, stopover: true },
                { location: { lat: -16.3827078, lng: -71.5117750 }, stopover: true },
                { location: { lat: -16.3862940, lng: -71.5148140 }, stopover: true },
                { location: { lat: -16.3879200, lng: -71.5162010 }, stopover: true },
                { location: { lat: -16.3908519, lng: -71.5186827 }, stopover: true },
                { location: { lat: -16.3931300, lng: -71.5206040 }, stopover: true },
                { location: { lat: -16.3941690, lng: -71.5214640 }, stopover: true },
                { location: { lat: -16.3935530, lng: -71.5227170 }, stopover: true },
                { location: { lat: -16.3954750, lng: -71.5239990 }, stopover: true },
                { location: { lat: -16.3971550, lng: -71.5251550 }, stopover: true },
                { location: { lat: -16.3982240, lng: -71.5266890 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.375502, lng: -71.499777 },
            { lat: -16.373109, lng: -71.500145 },
            { lat: -16.373362, lng: -71.502457 },
            { lat: -16.3730350, lng: -71.5028740 },
            { lat: -16.3742290, lng: -71.5044920 },
            { lat: -16.3758010, lng: -71.5068630 },
            { lat: -16.3770044, lng: -71.5086281 },
            { lat: -16.3799546, lng: -71.5095353 },
            { lat: -16.3827078, lng: -71.5117750 },
            { lat: -16.3862940, lng: -71.5148140 },
            { lat: -16.3879200, lng: -71.5162010 },
            { lat: -16.3908519, lng: -71.5186827 },
            { lat: -16.3931300, lng: -71.5206040 },
            { lat: -16.3941690, lng: -71.5214640 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta3'
    },

    Ruta3_Vuelta: {
        solicitud: {
            origin: { lat: -16.399557, lng: -71.528701 },
            destination: { lat: -16.376806, lng: -71.498764 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.4009290, lng: -71.5276840 }, stopover: true },
                { location: { lat: -16.4000710, lng: -71.5263170 }, stopover: true },
                { location: { lat: -16.3981197, lng: -71.5239162 }, stopover: true },
                { location: { lat: -16.3967350, lng: -71.5221840 }, stopover: true },
                { location: { lat: -16.3953080, lng: -71.5204060 }, stopover: true },
                { location: { lat: -16.3943220, lng: -71.5213400 }, stopover: true },
                { location: { lat: -16.3933510, lng: -71.5205460 }, stopover: true },
                { location: { lat: -16.3909577, lng: -71.5185623 }, stopover: true },
                { location: { lat: -16.3881280, lng: -71.5161680 }, stopover: true },
                { location: { lat: -16.3865340, lng: -71.5147840 }, stopover: true },
                { location: { lat: -16.3828130, lng: -71.5116250 }, stopover: true },
                { location: { lat: -16.3803282, lng: -71.5096513 }, stopover: true },
                { location: { lat: -16.3773510, lng: -71.5085050 }, stopover: true },
                { location: { lat: -16.3758440, lng: -71.5065960 }, stopover: true },
                { location: { lat: -16.3731280, lng: -71.5027630 }, stopover: true },
                { location: { lat: -16.3738518, lng: -71.5020764 }, stopover: true },
                { location: { lat: -16.3737020, lng: -71.5012340 }, stopover: true },
                { location: { lat: -16.3754210, lng: -71.4997430 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.3995570, lng: -71.5287010 },
            { lat: -16.3981197, lng: -71.5239162 },
            { lat: -16.3967350, lng: -71.5221840 },
            { lat: -16.3953080, lng: -71.5204060 },
            { lat: -16.3943220, lng: -71.5213400 },
            { lat: -16.3933510, lng: -71.5205460 },
            { lat: -16.3909577, lng: -71.5185623 },
            { lat: -16.3881280, lng: -71.5161680 },
            { lat: -16.3865340, lng: -71.5147840 },
            { lat: -16.3828130, lng: -71.5116250 },
            { lat: -16.3803282, lng: -71.5096513 },
            { lat: -16.3773510, lng: -71.5085050 },
            { lat: -16.3758440, lng: -71.5065960 },
            { lat: -16.3731280, lng: -71.5027630 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta3'
    },

    Ruta4_Ida: {
        solicitud: {
            origin: { lat: -16.365747, lng: -71.501906 },
            destination: { lat: -16.408259, lng: -71.542062 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.365748, lng: -71.501906 }, stopover: true },
                { location: { lat: -16.365890, lng: -71.502622 }, stopover: true },
                { location: { lat: -16.366885, lng: -71.501532 }, stopover: true },
                { location: { lat: -16.367482, lng: -71.500636 }, stopover: true },
                { location: { lat: -16.368205, lng: -71.503650 }, stopover: true },
                { location: { lat: -16.368357, lng: -71.507288 }, stopover: true },
                { location: { lat: -16.368915, lng: -71.509578 }, stopover: true },
                { location: { lat: -16.370732, lng: -71.511512 }, stopover: true },
                { location: { lat: -16.371820, lng: -71.512910 }, stopover: true },
                { location: { lat: -16.373352, lng: -71.511797 }, stopover: true },
                { location: { lat: -16.374917, lng: -71.513921 }, stopover: true },
                { location: { lat: -16.377403, lng: -71.517193 }, stopover: true },
                { location: { lat: -16.378842, lng: -71.516258 }, stopover: true },
                { location: { lat: -16.382180, lng: -71.517205 }, stopover: true },
                { location: { lat: -16.391750, lng: -71.533061 }, stopover: true },
                { location: { lat: -16.393594, lng: -71.537316 }, stopover: true },
                { location: { lat: -16.393594, lng: -71.537316 }, stopover: true },
                { location: { lat: -16.402460, lng: -71.538958 }, stopover: true },
                { location: { lat: -16.405606, lng: -71.539917 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.365748, lng: -71.501906 },
            { lat: -16.367482, lng: -71.500636 },
            { lat: -16.368205, lng: -71.503650 },
            { lat: -16.368357, lng: -71.507288 },
            { lat: -16.368915, lng: -71.509578 },
            { lat: -16.370732, lng: -71.511512 },
            { lat: -16.371820, lng: -71.512910 },
            { lat: -16.373352, lng: -71.511797 },
            { lat: -16.374917, lng: -71.513921 },
            { lat: -16.377403, lng: -71.517193 },
            { lat: -16.378842, lng: -71.516258 },
            { lat: -16.382180, lng: -71.517205 },
            { lat: -16.391750, lng: -71.533061 },
            { lat: -16.393594, lng: -71.537316 },
            { lat: -16.393594, lng: -71.537316 },
            { lat: -16.394764, lng: -71.537791 },
            { lat: -16.399281, lng: -71.539981 },
            { lat: -16.402460, lng: -71.538958 },
            { lat: -16.405708, lng: -71.540099 },
            { lat: -16.408392, lng: -71.542020 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta4'
    },

    Ruta4_Vuelta: {
        solicitud: {
            origin: { lat: -16.408259, lng: -71.542062 },
            destination: { lat: -16.365747, lng: -71.501906 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.407175, lng: -71.538575 }, stopover: true },
                { location: { lat: -16.403214, lng: -71.536795 }, stopover: true },
                { location: { lat: -16.401360, lng: -71.536073 }, stopover: true },
                { location: { lat: -16.392164, lng: -71.532378 }, stopover: true },
                { location: { lat: -16.388937, lng: -71.526260 }, stopover: true },
                { location: { lat: -16.385680, lng: -71.524602 }, stopover: true },
                { location: { lat: -16.386409, lng: -71.522936 }, stopover: true },
                { location: { lat: -16.382180, lng: -71.517205 }, stopover: true },
                { location: { lat: -16.378814, lng: -71.516096 }, stopover: true },
                { location: { lat: -16.378205, lng: -71.515242 }, stopover: true },
                { location: { lat: -16.377581, lng: -71.515363 }, stopover: true },
                { location: { lat: -16.374917, lng: -71.513921 }, stopover: true },
                { location: { lat: -16.373352, lng: -71.511797 }, stopover: true },
                { location: { lat: -16.371820, lng: -71.512910 }, stopover: true },
                { location: { lat: -16.370732, lng: -71.511512 }, stopover: true },
                { location: { lat: -16.368836, lng: -71.508194 }, stopover: true },
                { location: { lat: -16.368306, lng: -71.507076 }, stopover: true },
                { location: { lat: -16.368225, lng: -71.503925 }, stopover: true },
                { location: { lat: -16.369784, lng: -71.503754 }, stopover: true },
                { location: { lat: -16.369636, lng: -71.502064 }, stopover: true },
                { location: { lat: -16.366885, lng: -71.501532 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.408392, lng: -71.542020 },
            { lat: -16.407175, lng: -71.538575 },
            { lat: -16.403214, lng: -71.536795 },
            { lat: -16.401360, lng: -71.536073 },
            { lat: -16.392164, lng: -71.532378 },
            { lat: -16.388937, lng: -71.526260 },
            { lat: -16.385680, lng: -71.524602 },
            { lat: -16.386409, lng: -71.522936 },
            { lat: -16.382180, lng: -71.517205 },
            { lat: -16.378814, lng: -71.516096 },
            { lat: -16.377581, lng: -71.515363 },
            { lat: -16.374917, lng: -71.513921 },
            { lat: -16.373352, lng: -71.511797 },
            { lat: -16.370732, lng: -71.511512 },
            { lat: -16.368836, lng: -71.508194 },
            { lat: -16.368225, lng: -71.503925 },
            { lat: -16.369784, lng: -71.503754 },
            { lat: -16.369636, lng: -71.502064 },
            { lat: -16.366831, lng: -71.499585 },
            { lat: -16.365748, lng: -71.501906 }

        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta4'
    },

    Ruta5_Ida: {
        solicitud: {
            origin: { lat: -16.37982, lng: -71.49182 },
            destination: { lat: -16.42560, lng: -71.53457 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.378560, lng: -71.493560 }, stopover: true },
                { location: { lat: -16.378510, lng: -71.496630 }, stopover: true },
                { location: { lat: -16.382060, lng: -71.500450 }, stopover: true },
                { location: { lat: -16.381270, lng: -71.505370 }, stopover: true },
                { location: { lat: -16.380960, lng: -71.508440 }, stopover: true },
                { location: { lat: -16.380180, lng: -71.509590 }, stopover: true },
                { location: { lat: -16.391050, lng: -71.518790 }, stopover: true },
                { location: { lat: -16.394250, lng: -71.521530 }, stopover: true },
                { location: { lat: -16.394360, lng: -71.521460 }, stopover: true },
                { location: { lat: -16.396470, lng: -71.518750 }, stopover: true },
                { location: { lat: -16.399500, lng: -71.516820 }, stopover: true },
                { location: { lat: -16.414260, lng: -71.543610 }, stopover: true },
                { location: { lat: -16.420170, lng: -71.538210 }, stopover: true },
                { location: { lat: -16.423100, lng: -71.541820 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.379800, lng: -71.491760 },
            { lat: -16.378560, lng: -71.493560 },
            { lat: -16.379330, lng: -71.498630 },
            { lat: -16.381320, lng: -71.502340 },
            { lat: -16.380690, lng: -71.508840 },
            { lat: -16.382810, lng: -71.511820 },
            { lat: -16.398680, lng: -71.546860 },
            { lat: -16.391050, lng: -71.518790 },
            { lat: -16.394190, lng: -71.521470 },
            { lat: -16.397850, lng: -71.516780 },
            { lat: -16.400220, lng: -71.516010 },
            { lat: -16.405330, lng: -71.521530 },
            { lat: -16.406420, lng: -71.523170 },
            { lat: -16.408120, lng: -71.526740 },
            { lat: -16.412760, lng: -71.536900 },
            { lat: -16.413430, lng: -71.538960 },
            { lat: -16.414090, lng: -71.542840 },
            { lat: -16.420550, lng: -71.538990 },
            { lat: -16.422200, lng: -71.544070 },
            { lat: -16.422470, lng: -71.544230 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta5'
    },

    Ruta5_Vuelta: {
        solicitud: {
            origin: { lat: -16.42560, lng: -71.53457 },
            destination: { lat: -16.37982, lng: -71.49182 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.426250, lng: -71.533750 }, stopover: true },
                { location: { lat: -16.426920, lng: -71.533040 }, stopover: true },
                { location: { lat: -16.417130, lng: -71.532670 }, stopover: true },
                { location: { lat: -16.412530, lng: -71.535120 }, stopover: true },
                { location: { lat: -16.399630, lng: -71.515360 }, stopover: true },
                { location: { lat: -16.399420, lng: -71.516680 }, stopover: true },
                { location: { lat: -16.398370, lng: -71.515930 }, stopover: true },
                { location: { lat: -16.394260, lng: -71.521400 }, stopover: true },
                { location: { lat: -16.380960, lng: -71.508440 }, stopover: true },
                { location: { lat: -16.381260, lng: -71.505380 }, stopover: true },
                { location: { lat: -16.382050, lng: -71.500610 }, stopover: true },
                { location: { lat: -16.378700, lng: -71.497590 }, stopover: true },
                { location: { lat: -16.378390, lng: -71.496310 }, stopover: true },
                { location: { lat: -16.378540, lng: -71.493530 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.426740, lng: -71.533890 },
            { lat: -16.425730, lng: -71.533040 },
            { lat: -16.416750, lng: -71.532930 },
            { lat: -16.416030, lng: -71.533550 },
            { lat: -16.413660, lng: -71.534750 },
            { lat: -16.410490, lng: -71.532660 },
            { lat: -16.408220, lng: -71.526630 },
            { lat: -16.406280, lng: -71.522810 },
            { lat: -16.405340, lng: -71.521290 },
            { lat: -16.402930, lng: -71.517940 },
            { lat: -16.401240, lng: -71.516600 },
            { lat: -16.398380, lng: -71.515930 },
            { lat: -16.394310, lng: -71.521340 },
            { lat: -16.390580, lng: -71.518280 },
            { lat: -16.382860, lng: -71.511770 },
            { lat: -16.380690, lng: -71.508840 },
            { lat: -16.381410, lng: -71.502170 },
            { lat: -16.379330, lng: -71.498630 },
            { lat: -16.378560, lng: -71.493560 },
            { lat: -16.379800, lng: -71.491760 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta5'
    },

    Ruta6_Ida: {
        solicitud: {
            origin: { lat: -16.37980, lng: -71.49176 },
            destination: { lat: -16.42247, lng: -71.54423 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.37856, lng: -71.49356 }, stopover: true },
                { location: { lat: -16.37933, lng: -71.49863 }, stopover: true },
                { location: { lat: -16.38132, lng: -71.50234 }, stopover: true },
                { location: { lat: -16.38069, lng: -71.50884 }, stopover: true },
                { location: { lat: -16.38281, lng: -71.51182 }, stopover: true },
                { location: { lat: -16.38742, lng: -71.51573 }, stopover: true },
                { location: { lat: -16.39105, lng: -71.51879 }, stopover: true },
                { location: { lat: -16.39419, lng: -71.52147 }, stopover: true },
                { location: { lat: -16.39785, lng: -71.51678 }, stopover: true },
                { location: { lat: -16.40022, lng: -71.51601 }, stopover: true },
                { location: { lat: -16.40533, lng: -71.52153 }, stopover: true },
                { location: { lat: -16.40642, lng: -71.52317 }, stopover: true },
                { location: { lat: -16.40812, lng: -71.52674 }, stopover: true },
                { location: { lat: -16.41276, lng: -71.53690 }, stopover: true },
                { location: { lat: -16.41343, lng: -71.53896 }, stopover: true },
                { location: { lat: -16.41409, lng: -71.54284 }, stopover: true },
                { location: { lat: -16.42055, lng: -71.53899 }, stopover: true },
                { location: { lat: -16.42220, lng: -71.54407 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.37980, lng: -71.49176 },
            { lat: -16.38132, lng: -71.50234 },
            { lat: -16.38069, lng: -71.50884 },
            { lat: -16.38281, lng: -71.51182 },
            { lat: -16.38742, lng: -71.51573 },
            { lat: -16.39105, lng: -71.51879 },
            { lat: -16.39419, lng: -71.52147 },
            { lat: -16.39785, lng: -71.51678 },
            { lat: -16.40022, lng: -71.51601 },
            { lat: -16.40533, lng: -71.52153 },
            { lat: -16.40642, lng: -71.52317 },
            { lat: -16.40812, lng: -71.52674 },
            { lat: -16.41276, lng: -71.53690 },
            { lat: -16.41343, lng: -71.53896 },

        ],
        recorrido: 'Ida',
        nombre: 'Ruta6'
    },

    Ruta6_Vuelta: {
        solicitud: {
            origin: { lat: -16.42674, lng: -71.53389 },
            destination: { lat: -16.37980, lng: -71.49176 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.42674, lng: -71.53389 }, stopover: true },
                { location: { lat: -16.42573, lng: -71.53304 }, stopover: true },
                { location: { lat: -16.41675, lng: -71.53293 }, stopover: true },
                { location: { lat: -16.41603, lng: -71.53355 }, stopover: true },
                { location: { lat: -16.41366, lng: -71.53475 }, stopover: true },
                { location: { lat: -16.41049, lng: -71.53266 }, stopover: true },
                { location: { lat: -16.40822, lng: -71.52663 }, stopover: true },
                { location: { lat: -16.40628, lng: -71.52281 }, stopover: true },
                { location: { lat: -16.40534, lng: -71.52129 }, stopover: true },
                { location: { lat: -16.40293, lng: -71.51794 }, stopover: true },
                { location: { lat: -16.40124, lng: -71.51660 }, stopover: true },
                { location: { lat: -16.39838, lng: -71.51593 }, stopover: true },
                { location: { lat: -16.39431, lng: -71.52134 }, stopover: true },
                { location: { lat: -16.39058, lng: -71.51828 }, stopover: true },
                { location: { lat: -16.38286, lng: -71.51177 }, stopover: true },
                { location: { lat: -16.38069, lng: -71.50884 }, stopover: true },
                { location: { lat: -16.38141, lng: -71.50217 }, stopover: true },
                { location: { lat: -16.37933, lng: -71.49863 }, stopover: true },
                { location: { lat: -16.37856, lng: -71.49356 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.42674, lng: -71.53389 },
            { lat: -16.41675, lng: -71.53293 },
            { lat: -16.41603, lng: -71.53355 },
            { lat: -16.41366, lng: -71.53475 },
            { lat: -16.41049, lng: -71.53266 },
            { lat: -16.40822, lng: -71.52663 },
            { lat: -16.40628, lng: -71.52281 },
            { lat: -16.40534, lng: -71.52129 },
            { lat: -16.40293, lng: -71.51794 },
            { lat: -16.40124, lng: -71.51660 },
            { lat: -16.39838, lng: -71.51593 },
            { lat: -16.39431, lng: -71.52134 },
            { lat: -16.39058, lng: -71.51828 },
            { lat: -16.38286, lng: -71.51177 },
            { lat: -16.38069, lng: -71.50884 },
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta6'
    },

    Ruta7_Ida: {
        solicitud: {
            origin: { lat: -16.3848, lng: -71.57022 },
            destination: { lat: -16.42583, lng: -71.49277 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.384800, lng: -71.570220 }, stopover: true },
                { location: { lat: -16.380579, lng: -71.568915 }, stopover: true },
                { location: { lat: -16.375233, lng: -71.567978 }, stopover: true },
                { location: { lat: -16.375036, lng: -71.566817 }, stopover: true },
                { location: { lat: -16.374349, lng: -71.561483 }, stopover: true },
                { location: { lat: -16.379168, lng: -71.559184 }, stopover: true },
                { location: { lat: -16.381021, lng: -71.556761 }, stopover: true },
                { location: { lat: -16.384138, lng: -71.555935 }, stopover: true },
                { location: { lat: -16.389280, lng: -71.548936 }, stopover: true },
                { location: { lat: -16.391946, lng: -71.548793 }, stopover: true },
                { location: { lat: -16.397905, lng: -71.545947 }, stopover: true },
                { location: { lat: -16.403500, lng: -71.547666 }, stopover: true },
                { location: { lat: -16.404721, lng: -71.542879 }, stopover: true },
                { location: { lat: -16.408666, lng: -71.537000 }, stopover: true },
                { location: { lat: -16.402646, lng: -71.529500 }, stopover: true },
                { location: { lat: -16.399491, lng: -71.521671 }, stopover: true },
                { location: { lat: -16.402970, lng: -71.516549 }, stopover: true },
                { location: { lat: -16.410490, lng: -71.513380 }, stopover: true },
                { location: { lat: -16.427835, lng: -71.502801 }, stopover: true },
                { location: { lat: -16.425830, lng: -71.492770 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.384800, lng: -71.570220 },
            { lat: -16.375233, lng: -71.567978 },
            { lat: -16.375036, lng: -71.566817 },
            { lat: -16.374349, lng: -71.561483 },
            { lat: -16.379168, lng: -71.559184 },
            { lat: -16.381021, lng: -71.556761 },
            { lat: -16.384138, lng: -71.555935 },
            { lat: -16.389280, lng: -71.548936 },
            { lat: -16.391946, lng: -71.548793 },
            { lat: -16.397905, lng: -71.545947 },
            { lat: -16.403500, lng: -71.547666 },
            { lat: -16.404721, lng: -71.542879 },
            { lat: -16.408666, lng: -71.537000 },
            { lat: -16.402646, lng: -71.529500 },
            { lat: -16.399491, lng: -71.521671 },
            { lat: -16.402970, lng: -71.516549 },
        ],
        recorrido: 'Ida',
        nombre: 'Ruta7'
    },

    Ruta7_Vuelta: {
        solicitud: {
            origin: { lat: -16.42583, lng: -71.49277 },
            destination: { lat: -16.3848, lng: -71.57022 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.425830, lng: -71.492770 }, stopover: true },
                { location: { lat: -16.427835, lng: -71.502801 }, stopover: true },
                { location: { lat: -16.410468, lng: -71.513274 }, stopover: true },
                { location: { lat: -16.403266, lng: -71.516312 }, stopover: true },
                { location: { lat: -16.399392, lng: -71.521586 }, stopover: true },
                { location: { lat: -16.398187, lng: -71.526713 }, stopover: true },
                { location: { lat: -16.395463, lng: -71.530834 }, stopover: true },
                { location: { lat: -16.393299, lng: -71.537399 }, stopover: true },
                { location: { lat: -16.392254, lng: -71.540129 }, stopover: true },
                { location: { lat: -16.390006, lng: -71.546472 }, stopover: true },
                { location: { lat: -16.389147, lng: -71.548898 }, stopover: true },
                { location: { lat: -16.384107, lng: -71.555875 }, stopover: true },
                { location: { lat: -16.381007, lng: -71.556637 }, stopover: true },
                { location: { lat: -16.379168, lng: -71.559184 }, stopover: true },
                { location: { lat: -16.374349, lng: -71.561483 }, stopover: true },
                { location: { lat: -16.375036, lng: -71.566817 }, stopover: true },
                { location: { lat: -16.375233, lng: -71.567978 }, stopover: true },
                { location: { lat: -16.382885, lng: -71.575494 }, stopover: true },
                { location: { lat: -16.384230, lng: -71.573870 }, stopover: true },
                { location: { lat: -16.384800, lng: -71.570220 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.425830, lng: -71.492770 },
            { lat: -16.410459, lng: -71.513243 },
            { lat: -16.403259, lng: -71.516280 },
            { lat: -16.399392, lng: -71.521586 },
            { lat: -16.398187, lng: -71.526713 },
            { lat: -16.395463, lng: -71.530834 },
            { lat: -16.393299, lng: -71.537399 },
            { lat: -16.392254, lng: -71.540129 },
            { lat: -16.390006, lng: -71.546472 },
            { lat: -16.389147, lng: -71.548898 },
            { lat: -16.384089, lng: -71.555849 },
            { lat: -16.381005, lng: -71.556608 },
            { lat: -16.379168, lng: -71.559184 },
            { lat: -16.374349, lng: -71.561483 },
            { lat: -16.375036, lng: -71.566817 },
            { lat: -16.375233, lng: -71.567978 },
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta7'
    },

    Ruta8_Ida: {
        solicitud: {
            origin: { lat: -16.387058, lng: -71.575015 },
            destination: { lat: -16.430168, lng: -71.534405 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.387058, lng: -71.575015 }, stopover: true },
                { location: { lat: -16.392649, lng: -71.574616 }, stopover: true },
                { location: { lat: -16.403220, lng: -71.573008 }, stopover: true },
                { location: { lat: -16.404376, lng: -71.573231 }, stopover: true },
                { location: { lat: -16.403220, lng: -71.568348 }, stopover: true },
                { location: { lat: -16.400683, lng: -71.569132 }, stopover: true },
                { location: { lat: -16.394982, lng: -71.569286 }, stopover: true },
                { location: { lat: -16.392581, lng: -71.565814 }, stopover: true },
                { location: { lat: -16.392562, lng: -71.556064 }, stopover: true },
                { location: { lat: -16.388926, lng: -71.555101 }, stopover: true },
                { location: { lat: -16.389280, lng: -71.548936 }, stopover: true },
                { location: { lat: -16.391946, lng: -71.548793 }, stopover: true },
                { location: { lat: -16.397905, lng: -71.545947 }, stopover: true },
                { location: { lat: -16.403500, lng: -71.547666 }, stopover: true },
                { location: { lat: -16.404721, lng: -71.542879 }, stopover: true },
                { location: { lat: -16.416222, lng: -71.533643 }, stopover: true },
                { location: { lat: -16.421498, lng: -71.531358 }, stopover: true },
                { location: { lat: -16.425209, lng: -71.533374 }, stopover: true },
                { location: { lat: -16.428147, lng: -71.534175 }, stopover: true },
                { location: { lat: -16.430168, lng: -71.534405 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.387058, lng: -71.575015 },
            { lat: -16.403220, lng: -71.573008 },
            { lat: -16.404376, lng: -71.573231 },
            { lat: -16.403220, lng: -71.568348 },
            { lat: -16.400683, lng: -71.569132 },
            { lat: -16.394982, lng: -71.569286 },
            { lat: -16.392581, lng: -71.565814 },
            { lat: -16.392562, lng: -71.556064 },
            { lat: -16.388926, lng: -71.555101 },
            { lat: -16.389280, lng: -71.548936 },
            { lat: -16.391946, lng: -71.548793 },
            { lat: -16.397905, lng: -71.545947 },
            { lat: -16.403500, lng: -71.547666 },
            { lat: -16.404721, lng: -71.542879 },
            { lat: -16.416222, lng: -71.533643 },
        ],
        recorrido: 'Ida',
        nombre: 'Ruta8'
    },

    Ruta8_Vuelta: {
        solicitud: {
            origin: { lat: -16.430168, lng: -71.534405 },
            destination: { lat: -16.387058, lng: -71.575015 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.430168, lng: -71.534405 }, stopover: true },
                { location: { lat: -16.426127, lng: -71.515727 }, stopover: true },
                { location: { lat: -16.417877, lng: -71.515813 }, stopover: true },
                { location: { lat: -16.411832, lng: -71.512688 }, stopover: true },
                { location: { lat: -16.399491, lng: -71.521671 }, stopover: true },
                { location: { lat: -16.398187, lng: -71.526713 }, stopover: true },
                { location: { lat: -16.395463, lng: -71.530834 }, stopover: true },
                { location: { lat: -16.393299, lng: -71.537399 }, stopover: true },
                { location: { lat: -16.392254, lng: -71.540129 }, stopover: true },
                { location: { lat: -16.389280, lng: -71.548936 }, stopover: true },
                { location: { lat: -16.390889, lng: -71.552762 }, stopover: true },
                { location: { lat: -16.392562, lng: -71.556064 }, stopover: true },
                { location: { lat: -16.392581, lng: -71.565814 }, stopover: true },
                { location: { lat: -16.394982, lng: -71.569286 }, stopover: true },
                { location: { lat: -16.400683, lng: -71.569132 }, stopover: true },
                { location: { lat: -16.403220, lng: -71.568348 }, stopover: true },
                { location: { lat: -16.404376, lng: -71.573231 }, stopover: true },
                { location: { lat: -16.403220, lng: -71.573008 }, stopover: true },
                { location: { lat: -16.392649, lng: -71.574616 }, stopover: true },
                { location: { lat: -16.387058, lng: -71.575015 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.430168, lng: -71.534405 },
            { lat: -16.417877, lng: -71.515813 },
            { lat: -16.411832, lng: -71.512688 },
            { lat: -16.399491, lng: -71.521671 },
            { lat: -16.398187, lng: -71.526713 },
            { lat: -16.395463, lng: -71.530834 },
            { lat: -16.393299, lng: -71.537399 },
            { lat: -16.392254, lng: -71.540129 },
            { lat: -16.389280, lng: -71.548936 },
            { lat: -16.390889, lng: -71.552762 },
            { lat: -16.392562, lng: -71.556064 },
            { lat: -16.392581, lng: -71.565814 },
            { lat: -16.394982, lng: -71.569286 },
            { lat: -16.400683, lng: -71.569132 },
            { lat: -16.403220, lng: -71.568348 },
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta8'

    },

    Ruta9_Ida: {
        solicitud: {
            origin: { lat: -16.46169, lng: -71.52431 },
            destination: { lat: -16.39400, lng: -71.50296 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.46167, lng: -71.52433 }, stopover: true },
                { location: { lat: -16.45603, lng: -71.51871 }, stopover: true },
                { location: { lat: -16.45139, lng: -71.51439 }, stopover: true },
                { location: { lat: -16.44785, lng: -71.51629 }, stopover: true },
                { location: { lat: -16.44333, lng: -71.52169 }, stopover: true },
                { location: { lat: -16.43652, lng: -71.53073 }, stopover: true },
                { location: { lat: -16.43053, lng: -71.53271 }, stopover: true },
                { location: { lat: -16.42578, lng: -71.53306 }, stopover: true },
                { location: { lat: -16.42060, lng: -71.53138 }, stopover: true },
                { location: { lat: -16.41204, lng: -71.53475 }, stopover: true },
                { location: { lat: -16.41035, lng: -71.5326, }, stopover: true },
                { location: { lat: -16.40244, lng: -71.52509 }, stopover: true },
                { location: { lat: -16.40251, lng: -71.51781 }, stopover: true },
                { location: { lat: -16.40419, lng: -71.51929 }, stopover: true },
                { location: { lat: -16.39944, lng: -71.51668 }, stopover: true },
                { location: { lat: -16.39381, lng: -71.51144 }, stopover: true },
                { location: { lat: -16.39379, lng: -71.51108 }, stopover: true },
                { location: { lat: -16.39345, lng: -71.50936 }, stopover: true },
                { location: { lat: -16.39401, lng: -71.50297 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.461673, lng: -71.524326 },
            { lat: -16.460158, lng: -71.521153 },
            { lat: -16.449918, lng: -71.512411 },
            { lat: -16.447044, lng: -71.516154 },
            { lat: -16.443472, lng: -71.518408 },
            { lat: -16.441926, lng: -71.528789 },
            { lat: -16.436928, lng: -71.530585 },
            { lat: -16.430817, lng: -71.532734 },
            { lat: -16.425761, lng: -71.533018 },
            { lat: -16.415120, lng: -71.534077 },
            { lat: -16.412098, lng: -71.534760 },
            { lat: -16.408356, lng: -71.532299 },
            { lat: -16.404434, lng: -71.527490 },
            { lat: -16.400375, lng: -71.520307 },
            { lat: -16.404191, lng: -71.519255 },
            { lat: -16.399666, lng: -71.515290 },
            { lat: -16.398007, lng: -71.516424 },
            { lat: -16.395484, lng: -71.516323 },
            { lat: -16.393674, lng: -71.511030 },
            { lat: -16.394008, lng: -71.502937 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta19'
    },

    Ruta9_Vuelta: {
        solicitud: {
            origin: { lat: -16.39400, lng: -71.50296 },
            destination: { lat: -16.46169, lng: -71.52431 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.394130, lng: -71.502980 }, stopover: true },
                { location: { lat: -16.396510, lng: -71.508320 }, stopover: true },
                { location: { lat: -16.392120, lng: -71.513850 }, stopover: true },
                { location: { lat: -16.390510, lng: -71.518317 }, stopover: true },
                { location: { lat: -16.394208, lng: -71.521430 }, stopover: true },
                { location: { lat: -16.393424, lng: -71.522591 }, stopover: true },
                { location: { lat: -16.401970, lng: -71.526990 }, stopover: true },
                { location: { lat: -16.412090, lng: -71.535270 }, stopover: true },
                { location: { lat: -16.415910, lng: -71.533860 }, stopover: true },
                { location: { lat: -16.430310, lng: -71.534440 }, stopover: true },
                { location: { lat: -16.441690, lng: -71.529040 }, stopover: true },
                { location: { lat: -16.443450, lng: -71.518470 }, stopover: true },
                { location: { lat: -16.455410, lng: -71.516440 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.394129, lng: -71.502966 },
            { lat: -16.393662, lng: -71.511054 },
            { lat: -16.390521, lng: -71.518365 },
            { lat: -16.393582, lng: -71.522671 },
            { lat: -16.397215, lng: -71.525116 },
            { lat: -16.400957, lng: -71.527633 },
            { lat: -16.404269, lng: -71.527420 },
            { lat: -16.408309, lng: -71.532270 },
            { lat: -16.411982, lng: -71.535213 },
            { lat: -16.415289, lng: -71.534190 },
            { lat: -16.421406, lng: -71.531356 },
            { lat: -16.425336, lng: -71.533428 },
            { lat: -16.430090, lng: -71.534449 },
            { lat: -16.434600, lng: -71.531542 },
            { lat: -16.441966, lng: -71.528799 },
            { lat: -16.443320, lng: -71.521352 },
            { lat: -16.447208, lng: -71.516246 },
            { lat: -16.449907, lng: -71.512435 },
            { lat: -16.456454, lng: -71.517489 },
            { lat: -16.461628, lng: -71.524270 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta9'
    },

    Ruta10_Ida: {
        solicitud: {
            origin: { lat: -16.42929, lng: -71.491115 },
            destination: { lat: -16.40194, lng: -71.54705 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.42943, lng: -71.49249 }, stopover: true },
                { location: { lat: -16.42951, lng: -71.49315 }, stopover: true },
                { location: { lat: -16.42921, lng: -71.49364 }, stopover: true },
                { location: { lat: -16.42916, lng: -71.49556 }, stopover: true },
                { location: { lat: -16.42977, lng: -71.49793 }, stopover: true },
                { location: { lat: -16.42924, lng: -71.50084 }, stopover: true },
                { location: { lat: -16.42716, lng: -71.50338 }, stopover: true },
                { location: { lat: -16.41195, lng: -71.51262 }, stopover: true },
                { location: { lat: -16.41175, lng: -71.50887 }, stopover: true },
                { location: { lat: -16.41063, lng: -71.50555 }, stopover: true },
                { location: { lat: -16.40829, lng: -71.50806 }, stopover: true },
                { location: { lat: -16.40534, lng: -71.51252 }, stopover: true },
                { location: { lat: -16.40301, lng: -71.51618 }, stopover: true },
                { location: { lat: -16.40187, lng: -71.51789 }, stopover: true },
                { location: { lat: -16.39768, lng: -71.51695 }, stopover: true },
                { location: { lat: -16.39272, lng: -71.52345 }, stopover: true },
                { location: { lat: -16.39509, lng: -71.53233 }, stopover: true },
                { location: { lat: -16.39843, lng: -71.53954 }, stopover: true },
                { location: { lat: -16.40194, lng: -71.54705 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.429287, lng: -71.491159 },
            { lat: -16.429747, lng: -71.499679 },
            { lat: -16.422173, lng: -71.507363 },
            { lat: -16.417256, lng: -71.510156 },
            { lat: -16.412197, lng: -71.512481 },
            { lat: -16.405062, lng: -71.514790 },
            { lat: -16.403309, lng: -71.515654 },
            { lat: -16.397842, lng: -71.516621 },
            { lat: -16.393912, lng: -71.521913 },
            { lat: -16.393360, lng: -71.528781 },
            { lat: -16.394195, lng: -71.530874 },
            { lat: -16.395081, lng: -71.532306 },
            { lat: -16.393937, lng: -71.535667 },
            { lat: -16.394113, lng: -71.536919 },
            { lat: -16.396761, lng: -71.537960 },
            { lat: -16.398671, lng: -71.538730 },
            { lat: -16.396775, lng: -71.543658 },
            { lat: -16.397163, lng: -71.545397 },
            { lat: -16.399461, lng: -71.546338 },
            { lat: -16.403615, lng: -71.547722 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta10'
    },

    Ruta10_Vuelta: {
        solicitud: {
            origin: { lat: -16.40194, lng: -71.54705 },
            destination: { lat: -16.42929, lng: -71.491115 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.40376, lng: -71.54773 }, stopover: true },
                { location: { lat: -16.40703, lng: -71.54201 }, stopover: true },
                { location: { lat: -16.40761, lng: -71.53871 }, stopover: true },
                { location: { lat: -16.41215, lng: -71.53546 }, stopover: true },
                { location: { lat: -16.41554, lng: -71.53407 }, stopover: true },
                { location: { lat: -16.42177, lng: -71.53132 }, stopover: true },
                { location: { lat: -16.43018, lng: -71.53442 }, stopover: true },
                { location: { lat: -16.43064, lng: -71.53247 }, stopover: true },
                { location: { lat: -16.42737, lng: -71.51888 }, stopover: true },
                { location: { lat: -16.42468, lng: -71.51267 }, stopover: true },
                { location: { lat: -16.42776, lng: -71.50282 }, stopover: true },
                { location: { lat: -16.42937, lng: -71.49279 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.403736, lng: -71.547759 },
            { lat: -16.404374, lng: -71.543042 },
            { lat: -16.405660, lng: -71.542283 },
            { lat: -16.408707, lng: -71.541102 },
            { lat: -16.407125, lng: -71.539192 },
            { lat: -16.408299, lng: -71.538196 },
            { lat: -16.410193, lng: -71.536186 },
            { lat: -16.413341, lng: -71.535068 },
            { lat: -16.415582, lng: -71.534069 },
            { lat: -16.421310, lng: -71.531340 },
            { lat: -16.425094, lng: -71.533336 },
            { lat: -16.430359, lng: -71.534402 },
            { lat: -16.429743, lng: -71.526694 },
            { lat: -16.427296, lng: -71.518592 },
            { lat: -16.425082, lng: -71.513470 },
            { lat: -16.423293, lng: -71.509753 },
            { lat: -16.422306, lng: -71.507636 },
            { lat: -16.424746, lng: -71.505882 },
            { lat: -16.429367, lng: -71.496306 },
            { lat: -16.429310, lng: -71.491165 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta10'
    },

    Ruta11_Ida: {
        solicitud: {
            origin: { lat: -16.359427, lng: -71.509089 },
            destination: { lat: -16.423153, lng: -71.542591 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.364538, lng: -71.515416 }, stopover: true },
                { location: { lat: -16.367322, lng: -71.519424 }, stopover: true },
                { location: { lat: -16.368999, lng: -71.519330 }, stopover: true },
                { location: { lat: -16.378470, lng: -71.527817 }, stopover: true },
                { location: { lat: -16.379973, lng: -71.526443 }, stopover: true },
                { location: { lat: -16.377753, lng: -71.524983 }, stopover: true },
                { location: { lat: -16.378849, lng: -71.523002 }, stopover: true },
                { location: { lat: -16.378102, lng: -71.521241 }, stopover: true },
                { location: { lat: -16.380581, lng: -71.519321 }, stopover: true },
                { location: { lat: -16.385833, lng: -71.527249 }, stopover: true },
                { location: { lat: -16.388901, lng: -71.526189 }, stopover: true },
                { location: { lat: -16.390808, lng: -71.525913 }, stopover: true },
                { location: { lat: -16.396624, lng: -71.518549 }, stopover: true },
                { location: { lat: -16.400194, lng: -71.520361 }, stopover: true },
                { location: { lat: -16.399926, lng: -71.522084 }, stopover: true },
                { location: { lat: -16.405797, lng: -71.529284 }, stopover: true },
                { location: { lat: -16.410839, lng: -71.535171 }, stopover: true },
                { location: { lat: -16.416715, lng: -71.533292 }, stopover: true },
                { location: { lat: -16.42317, lng: -71.54161 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.359427, lng: -71.509089 },
            { lat: -16.362028, lng: -71.513599 },
            { lat: -16.364530, lng: -71.515414 },
            { lat: -16.367270, lng: -71.519366 },
            { lat: -16.368882, lng: -71.519305 },
            { lat: -16.371222, lng: -71.516691 },
            { lat: -16.374671, lng: -71.522629 },
            { lat: -16.378040, lng: -71.524532 },
            { lat: -16.378157, lng: -71.521353 },
            { lat: -16.379410, lng: -71.520118 },
            { lat: -16.383255, lng: -71.524638 },
            { lat: -16.389452, lng: -71.526704 },
            { lat: -16.394248, lng: -71.521652 },
            { lat: -16.396579, lng: -71.518624 },
            { lat: -16.400129, lng: -71.520316 },
            { lat: -16.402356, lng: -71.525069 },
            { lat: -16.408386, lng: -71.532386 },
            { lat: -16.416374, lng: -71.533496 },
            { lat: -16.420565, lng: -71.539217 },
            { lat: -16.423038, lng: -71.542801 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta11'
    },

    Ruta11_Vuelta: {
        solicitud: {
            origin: { lat: -16.4229305, lng: -71.5426354 },
            destination: { lat: -16.359427, lng: -71.509089 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.4223439, lng: -71.5441214 }, stopover: true },
                { location: { lat: -16.4171439, lng: -71.5331058 }, stopover: true },
                { location: { lat: -16.4124603, lng: -71.5351402 }, stopover: true },
                { location: { lat: -16.4104826, lng: -71.5326239 }, stopover: true },
                { location: { lat: -16.4096181, lng: -71.5322407 }, stopover: true },
                { location: { lat: -16.4043747, lng: -71.5274450 }, stopover: true },
                { location: { lat: -16.4055678, lng: -71.5260761 }, stopover: true },
                { location: { lat: -16.4081709, lng: -71.5297412 }, stopover: true },
                { location: { lat: -16.4092012, lng: -71.5291488 }, stopover: true },
                { location: { lat: -16.4084668, lng: -71.5273356 }, stopover: true },
                { location: { lat: -16.3995426, lng: -71.5153179 }, stopover: true },
                { location: { lat: -16.3983801, lng: -71.5159699 }, stopover: true },
                { location: { lat: -16.3895836, lng: -71.5267802 }, stopover: true },
                { location: { lat: -16.3865284, lng: -71.5269733 }, stopover: true },
                { location: { lat: -16.3839877, lng: -71.5252193 }, stopover: true },
                { location: { lat: -16.3811951, lng: -71.5189424 }, stopover: true },
                { location: { lat: -16.3780926, lng: -71.5212644 }, stopover: true },
                { location: { lat: -16.3788608, lng: -71.5229900 }, stopover: true },
                { location: { lat: -16.3779919, lng: -71.5246241 }, stopover: true },
                { location: { lat: -16.3799778, lng: -71.5264672 }, stopover: true },
                { location: { lat: -16.3783659, lng: -71.5277734 }, stopover: true },
                { location: { lat: -16.3714417, lng: -71.5166068 }, stopover: true },
                { location: { lat: -16.3694941, lng: -71.5182724 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.4223778, lng: -71.5440237 },
            { lat: -16.4215858, lng: -71.5414179 },
            { lat: -16.4163267, lng: -71.5332190 },
            { lat: -16.4133469, lng: -71.5348413 },
            { lat: -16.4117572, lng: -71.5344432 },
            { lat: -16.4109596, lng: -71.5333157 },
            { lat: -16.4057026, lng: -71.5289640 },
            { lat: -16.4044569, lng: -71.5274436 },
            { lat: -16.4058452, lng: -71.5221469 },
            { lat: -16.4053539, lng: -71.5212372 },
            { lat: -16.3934125, lng: -71.5224761 },
            { lat: -16.3887705, lng: -71.5262105 },
            { lat: -16.3786713, lng: -71.5232247 },
            { lat: -16.3782878, lng: -71.5240210 },
            { lat: -16.3779285, lng: -71.5245938 },
            { lat: -16.3796659, lng: -71.5266417 },
            { lat: -16.3784089, lng: -71.5277752 },
            { lat: -16.3714912, lng: -71.5166505 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta11'
    },

    Ruta12_Ida: {
        solicitud: {
            origin: { lat: -16.403476, lng: -71.494438 },
            destination: { lat: -16.407710, lng: -71.533938 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.405002, lng: -71.501107 }, stopover: true },
                { location: { lat: -16.400429, lng: -71.504589 }, stopover: true },
                { location: { lat: -16.401513, lng: -71.508537 }, stopover: true },
                { location: { lat: -16.403160, lng: -71.511711 }, stopover: true },
                { location: { lat: -16.402451, lng: -71.514979 }, stopover: true },
                { location: { lat: -16.403047, lng: -71.518197 }, stopover: true },
                { location: { lat: -16.408109, lng: -71.526702 }, stopover: true },
                { location: { lat: -16.408893, lng: -71.532837 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.403722, lng: -71.494809 },
            { lat: -16.404709, lng: -71.498214 },
            { lat: -16.405002, lng: -71.501107 },
            { lat: -16.403398, lng: -71.502156 },
            { lat: -16.400429, lng: -71.504589 },
            { lat: -16.401512, lng: -71.508537 },
            { lat: -16.402070, lng: -71.509843 },
            { lat: -16.403160, lng: -71.511711 },
            { lat: -16.403919, lng: -71.512903 },
            { lat: -16.402451, lng: -71.514979 },
            { lat: -16.401719, lng: -71.518078 },
            { lat: -16.403047, lng: -71.518197 },
            { lat: -16.405092, lng: -71.521061 },
            { lat: -16.406350, lng: -71.523071 },
            { lat: -16.408109, lng: -71.526702 },
            { lat: -16.409166, lng: -71.530458 },
            { lat: -16.408893, lng: -71.532837 },
            { lat: -16.407710, lng: -71.533938 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta12'
    },

    Ruta12_Vuelta: {
        solicitud: {
            origin: { lat: -16.407710, lng: -71.533938 },
            destination: { lat: -16.403476, lng: -71.494438 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.407710, lng: -71.533938 }, stopover: false },
                { location: { lat: -16.404887, lng: -71.532347 }, stopover: false },
                { location: { lat: -16.402534, lng: -71.529420 }, stopover: true },
                { location: { lat: -16.402534, lng: -71.52942 }, stopover: true },
                { location: { lat: -16.402499, lng: -71.525137 }, stopover: true },
                { location: { lat: -16.399566, lng: -71.521671 }, stopover: true },
                { location: { lat: -16.399557, lng: -71.515725 }, stopover: true },
                { location: { lat: -16.399721, lng: -71.511831 }, stopover: true },
                { location: { lat: -16.402422, lng: -71.514933 }, stopover: true },
                { location: { lat: -16.403160, lng: -71.511711 }, stopover: true },
                { location: { lat: -16.400483, lng: -71.507091 }, stopover: true },
                { location: { lat: -16.405056, lng: -71.502802 }, stopover: true },
                { location: { lat: -16.404836, lng: -71.498590 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.407710, lng: -71.533938 },
            { lat: -16.406093, lng: -71.533732 },
            { lat: -16.405042, lng: -71.532517 },
            { lat: -16.404175, lng: -71.531462 },
            { lat: -16.402534, lng: -71.529420 },
            { lat: -16.404259, lng: -71.527511 },
            { lat: -16.402499, lng: -71.525137 },
            { lat: -16.400874, lng: -71.523139 },
            { lat: -16.399566, lng: -71.521671 },
            { lat: -16.399360, lng: -71.518576 },
            { lat: -16.399557, lng: -71.515725 },
            { lat: -16.399721, lng: -71.511831 },
            { lat: -16.402422, lng: -71.514933 },
            { lat: -16.403160, lng: -71.511711 },
            { lat: -16.403160, lng: -71.511711 },
            { lat: -16.402070, lng: -71.509843 },
            { lat: -16.400483, lng: -71.507091 },
            { lat: -16.405056, lng: -71.502802 },
            { lat: -16.404836, lng: -71.498590 },
            { lat: -16.403722, lng: -71.494809 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta12'
    },

    Ruta13_Ida: {
        solicitud: {
            origin: { lat: -16.337710, lng: -71.552126 },
            destination: { lat: -16.406574, lng: -71.530123 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.333802, lng: -71.548382 }, stopover: true },
                { location: { lat: -16.331635, lng: -71.544194 }, stopover: true },
                { location: { lat: -16.330666, lng: -71.542712 }, stopover: true },
                { location: { lat: -16.331700, lng: -71.541921 }, stopover: true },
                { location: { lat: -16.333291, lng: -71.538477 }, stopover: true },
                { location: { lat: -16.354867, lng: -71.541874 }, stopover: true },
                { location: { lat: -16.354679, lng: -71.543493 }, stopover: true },
                { location: { lat: -16.365562, lng: -71.544229 }, stopover: true },
                { location: { lat: -16.390188, lng: -71.547840 }, stopover: true },
                { location: { lat: -16.390432, lng: -71.547204 }, stopover: true },
                { location: { lat: -16.392522, lng: -71.540168 }, stopover: true },
                { location: { lat: -16.395703, lng: -71.539796 }, stopover: true },
                { location: { lat: -16.395182, lng: -71.539146 }, stopover: true },
                { location: { lat: -16.393369, lng: -71.538680 }, stopover: true },
                { location: { lat: -16.392137, lng: -71.534145 }, stopover: true },
                { location: { lat: -16.391723, lng: -71.530674 }, stopover: true },
                { location: { lat: -16.393494, lng: -71.530600 }, stopover: true },
                { location: { lat: -16.393302, lng: -71.527753 }, stopover: true },
                { location: { lat: -16.394629, lng: -71.526326 }, stopover: true },
                { location: { lat: -16.394618, lng: -71.525612 }, stopover: true },
                { location: { lat: -16.397657, lng: -71.520598 }, stopover: true },
                { location: { lat: -16.398861, lng: -71.521246 }, stopover: true },
                { location: { lat: -16.399562, lng: -71.515512 }, stopover: true },
                { location: { lat: -16.408467, lng: -71.527641 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.337710, lng: -71.552126 },
            { lat: -16.330666, lng: -71.542712 },
            { lat: -16.354867, lng: -71.541874 },
            { lat: -16.382219, lng: -71.545523 },
            { lat: -16.389605, lng: -71.547600 },
            { lat: -16.392522, lng: -71.540168 },
            { lat: -16.392601, lng: -71.537432 },
            { lat: -16.392931, lng: -71.535040 },
            { lat: -16.391723, lng: -71.530674 },
            { lat: -16.394476, lng: -71.526156 },
            { lat: -16.398861, lng: -71.521246 },
            { lat: -16.399562, lng: -71.515512 },
            { lat: -16.405689, lng: -71.522199 },
            { lat: -16.406574, lng: -71.530123 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta13'
    },

    Ruta13_Vuelta: {
        solicitud: {
            origin: { lat: -16.406574, lng: -71.530123 },
            destination: { lat: -16.337710, lng: -71.552126 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.401938, lng: -71.524481 }, stopover: true },
                { location: { lat: -16.399958, lng: -71.526221 }, stopover: true },
                { location: { lat: -16.399513, lng: -71.525754 }, stopover: true },
                { location: { lat: -16.396386, lng: -71.528331 }, stopover: true },
                { location: { lat: -16.389595, lng: -71.547535 }, stopover: true },
                { location: { lat: -16.345476, lng: -71.5415344 }, stopover: true },
                { location: { lat: -16.343326, lng: -71.541279 }, stopover: true },
                { location: { lat: -16.343400, lng: -71.540690 }, stopover: true },
                { location: { lat: -16.333291, lng: -71.538470 }, stopover: true },
                { location: { lat: -16.331683, lng: -71.541877 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.406574, lng: -71.530123 },
            { lat: -16.401938, lng: -71.524481 },
            { lat: -16.399958, lng: -71.526221 },
            { lat: -16.396386, lng: -71.528331 },
            { lat: -16.395420, lng: -71.531290 },
            { lat: -16.393332, lng: -71.537343 },
            { lat: -16.391487, lng: -71.542318 },
            { lat: -16.389595, lng: -71.547535 },
            { lat: -16.381820, lng: -71.545401 },
            { lat: -16.361935, lng: -71.543956 },
            { lat: -16.354821, lng: -71.542461 },
            { lat: -16.344880, lng: -71.541455 },
            { lat: -16.337829, lng: -71.539906 },
            { lat: -16.333291, lng: -71.538470 },
            { lat: -16.331683, lng: -71.541877 },
            { lat: -16.330101, lng: -71.542968 },
            { lat: -16.337729, lng: -71.552171 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta13'
    },

    Ruta14_Ida: {
        solicitud: {
            origin: { lat: -16.461711, lng: -71.524362 },
            destination: { lat: -16.389966, lng: -71.547015 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.459751, lng: -71.522359 }, stopover: true },
                { location: { lat: -16.456411, lng: -71.517414 }, stopover: true },
                { location: { lat: -16.455821, lng: -71.518018 }, stopover: true },
                { location: { lat: -16.447123, lng: -71.516316 }, stopover: true },
                { location: { lat: -16.447251, lng: -71.516687 }, stopover: true },
                { location: { lat: -16.446200, lng: -71.518597 }, stopover: true },
                { location: { lat: -16.443706, lng: -71.517917 }, stopover: true },
                { location: { lat: -16.443155, lng: -71.518970 }, stopover: true },
                { location: { lat: -16.442239, lng: -71.525039 }, stopover: true },
                { location: { lat: -16.440809, lng: -71.525506 }, stopover: true },
                { location: { lat: -16.441936, lng: -71.528853 }, stopover: true },
                { location: { lat: -16.424950, lng: -71.533127 }, stopover: true },
                { location: { lat: -16.405659, lng: -71.540072 }, stopover: true },
                { location: { lat: -16.403389, lng: -71.540449 }, stopover: true },
                { location: { lat: -16.403080, lng: -71.541140 }, stopover: true },
                { location: { lat: -16.404309, lng: -71.542514 }, stopover: true },
                { location: { lat: -16.404226, lng: -71.546256 }, stopover: true },
                { location: { lat: -16.404838, lng: -71.546563 }, stopover: true },
                { location: { lat: -16.404293, lng: -71.547908 }, stopover: true },
                { location: { lat: -16.396062, lng: -71.544955 }, stopover: true },
                { location: { lat: -16.394662, lng: -71.547591 }, stopover: true },
                { location: { lat: -16.395193, lng: -71.548271 }, stopover: true },
                { location: { lat: -16.390205, lng: -71.547781 }, stopover: true },
                { location: { lat: -16.390425, lng: -71.547191 }, stopover: true },
                { location: { lat: -16.390425, lng: -71.547191 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.461711, lng: -71.524362 },
            { lat: -16.459751, lng: -71.522359 },
            { lat: -16.456411, lng: -71.517414 },
            { lat: -16.447123, lng: -71.516316 },
            { lat: -16.444272, lng: -71.518061 },
            { lat: -16.442239, lng: -71.525039 },
            { lat: -16.441936, lng: -71.528853 },
            { lat: -16.430844, lng: -71.532754 },
            { lat: -16.425645, lng: -71.533021 },
            { lat: -16.417242, lng: -71.532626 },
            { lat: -16.416391, lng: -71.533317 },
            { lat: -16.409507, lng: -71.536577 },
            { lat: -16.406727, lng: -71.539358 },
            { lat: -16.404309, lng: -71.542514 },
            { lat: -16.404293, lng: -71.547908 },
            { lat: -16.395193, lng: -71.548271 },
            { lat: -16.389966, lng: -71.547015 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta14'
    },

    Ruta14_Vuelta: {
        solicitud: {
            origin: { lat: -16.389966, lng: -71.547015 },
            destination: { lat: -16.461711, lng: -71.524362 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.391723, lng: -71.530674 }, stopover: true },
                { location: { lat: -16.393494, lng: -71.530600 }, stopover: true },
                { location: { lat: -16.392172, lng: -71.524110 }, stopover: true },
                { location: { lat: -16.387459, lng: -71.515628 }, stopover: true },
                { location: { lat: -16.385945, lng: -71.514370 }, stopover: true },
                { location: { lat: -16.385089, lng: -71.515475 }, stopover: true },
                { location: { lat: -16.379378, lng: -71.510543 }, stopover: true },
                { location: { lat: -16.380971, lng: -71.508474 }, stopover: true },
                { location: { lat: -16.386840, lng: -71.513222 }, stopover: true },
                { location: { lat: -16.388259, lng: -71.511452 }, stopover: true },
                { location: { lat: -16.390948, lng: -71.515494 }, stopover: true },
                { location: { lat: -16.397531, lng: -71.520779 }, stopover: true },
                { location: { lat: -16.399422, lng: -71.521562 }, stopover: true },
                { location: { lat: -16.405521, lng: -71.528895 }, stopover: true },
                { location: { lat: -16.411142, lng: -71.535748 }, stopover: true },
                { location: { lat: -16.441985, lng: -71.528982 }, stopover: true },
                { location: { lat: -16.440836, lng: -71.525539 }, stopover: true },
                { location: { lat: -16.443730, lng: -71.517968 }, stopover: true },
                { location: { lat: -16.446212, lng: -71.518615 }, stopover: true },
                { location: { lat: -16.446826, lng: -71.517718 }, stopover: true },
                { location: { lat: -16.453479, lng: -71.513214 }, stopover: true },
                { location: { lat: -16.453316, lng: -71.513985 }, stopover: true },
                { location: { lat: -16.453790, lng: -71.516602 }, stopover: true },
                { location: { lat: -16.456400, lng: -71.517457 }, stopover: true },
                { location: { lat: -16.459727, lng: -71.522353 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.389966, lng: -71.547015 },
            { lat: -16.392522, lng: -71.540168 },
            { lat: -16.392601, lng: -71.537432 },
            { lat: -16.392931, lng: -71.535040 },
            { lat: -16.391723, lng: -71.530674 },
            { lat: -16.391944, lng: -71.524411 },
            { lat: -16.387459, lng: -71.515628 },
            { lat: -16.379378, lng: -71.510543 },
            { lat: -16.392053, lng: -71.513920 },
            { lat: -16.397531, lng: -71.520779 },
            { lat: -16.400241, lng: -71.520347 },
            { lat: -16.401999, lng: -71.524520 },
            { lat: -16.405521, lng: -71.528895 },
            { lat: -16.453479, lng: -71.513214 },
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta14'
    },

    Ruta15_Ida: {
        solicitud: {
            origin: { lat: -16.41492, lng: -71.49246 },
            destination: { lat: -16.40588, lng: -71.53165 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.41521, lng: -71.49429 }, stopover: true },
                { location: { lat: -16.41651, lng: -71.49410 }, stopover: true },
                { location: { lat: -16.41686, lng: -71.49663 }, stopover: true },
                { location: { lat: -16.41557, lng: -71.49719 }, stopover: true },
                { location: { lat: -16.41502, lng: -71.49787 }, stopover: true },
                { location: { lat: -16.41287, lng: -71.50112 }, stopover: true },
                { location: { lat: -16.41030, lng: -71.50500 }, stopover: true },
                { location: { lat: -16.40770, lng: -71.50893 }, stopover: true },
                { location: { lat: -16.40304, lng: -71.51630 }, stopover: true },
                { location: { lat: -16.39947, lng: -71.52158 }, stopover: true },
                { location: { lat: -16.40566, lng: -71.52897 }, stopover: true },
                { location: { lat: -16.40881, lng: -71.53290 }, stopover: true },
                { location: { lat: -16.40768, lng: -71.53396 }, stopover: true },
                { location: { lat: -16.40588, lng: -71.53165 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.415224, lng: -71.494280 },
            { lat: -16.416506, lng: -71.494157 },
            { lat: -16.416740, lng: -71.495928 },
            { lat: -16.416825, lng: -71.496591 },
            { lat: -16.413102, lng: -71.500701 },
            { lat: -16.411832, lng: -71.502650 },
            { lat: -16.410201, lng: -71.505018 },
            { lat: -16.407636, lng: -71.508908 },
            { lat: -16.406645, lng: -71.510465 },
            { lat: -16.405289, lng: -71.512523 },
            { lat: -16.404452, lng: -71.513852 },
            { lat: -16.402827, lng: -71.516451 },
            { lat: -16.401688, lng: -71.518102 },
            { lat: -16.399431, lng: -71.521521 },
            { lat: -16.401884, lng: -71.524453 },
            { lat: -16.404287, lng: -71.527420 },
            { lat: -16.406948, lng: -71.530622 },
            { lat: -16.408763, lng: -71.532894 },
            { lat: -16.407692, lng: -71.533936 },
            { lat: -16.405893, lng: -71.531662 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta15'
    },

    Ruta15_Vuelta: {
        solicitud: {
            origin: { lat: -16.40588, lng: -71.53165 },
            destination: { lat: -16.41492, lng: -71.49246 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.40662, lng: -71.53105 }, stopover: true },
                { location: { lat: -16.40698, lng: -71.53064 }, stopover: true },
                { location: { lat: -16.40436, lng: -71.52744 }, stopover: true },
                { location: { lat: -16.40650, lng: -71.52521 }, stopover: true },
                { location: { lat: -16.40763, lng: -71.52700 }, stopover: true },
                { location: { lat: -16.40823, lng: -71.52671 }, stopover: true },
                { location: { lat: -16.40713, lng: -71.52453 }, stopover: true },
                { location: { lat: -16.40432, lng: -71.51945 }, stopover: true },
                { location: { lat: -16.40388, lng: -71.51874 }, stopover: true },
                { location: { lat: -16.40334, lng: -71.51724 }, stopover: true },
                { location: { lat: -16.40314, lng: -71.51650 }, stopover: true },
                { location: { lat: -16.40455, lng: -71.51391 }, stopover: true },
                { location: { lat: -16.41549, lng: -71.49726 }, stopover: true },
                { location: { lat: -16.41684, lng: -71.49663 }, stopover: true },
                { location: { lat: -16.41650, lng: -71.49409 }, stopover: true },
                { location: { lat: -16.41523, lng: -71.49429 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.405880, lng: -71.531609 },
            { lat: -16.406972, lng: -71.530688 },
            { lat: -16.404405, lng: -71.527465 },
            { lat: -16.408085, lng: -71.526767 },
            { lat: -16.404361, lng: -71.519511 },
            { lat: -16.403163, lng: -71.516498 },
            { lat: -16.405498, lng: -71.515520 },
            { lat: -16.404548, lng: -71.513906 },
            { lat: -16.405309, lng: -71.512758 },
            { lat: -16.406530, lng: -71.510884 },
            { lat: -16.407595, lng: -71.509244 },
            { lat: -16.409440, lng: -71.506484 },
            { lat: -16.410225, lng: -71.505253 },
            { lat: -16.410972, lng: -71.504035 },
            { lat: -16.412086, lng: -71.502399 },
            { lat: -16.413010, lng: -71.500945 },
            { lat: -16.414211, lng: -71.499164 },
            { lat: -16.416856, lng: -71.496647 },
            { lat: -16.415251, lng: -71.494262 },
            { lat: -16.414354, lng: -71.492587 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta15'
    },

    Ruta16_Ida: {
        solicitud: {
            origin: { lat: -16.416442, lng: -71.481015 },
            destination: { lat: -16.422519, lng: -71.544020 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.414558, lng: -71.482298 }, stopover: true },
                { location: { lat: -16.415517, lng: -71.489280 }, stopover: true },
                { location: { lat: -16.415873, lng: -71.488978 }, stopover: true },
                { location: { lat: -16.421898, lng: -71.498287 }, stopover: true },
                { location: { lat: -16.411900, lng: -71.512623 }, stopover: true },
                { location: { lat: -16.405495, lng: -71.515400 }, stopover: true },
                { location: { lat: -16.404523, lng: -71.513894 }, stopover: true },
                { location: { lat: -16.399456, lng: -71.521522 }, stopover: true },
                { location: { lat: -16.405854, lng: -71.529325 }, stopover: true },
                { location: { lat: -16.409997, lng: -71.534375 }, stopover: true },
                { location: { lat: -16.423494, lng: -71.532151 }, stopover: true },
                { location: { lat: -16.425256, lng: -71.533372 }, stopover: true },
                { location: { lat: -16.422519, lng: -71.544020 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.415687, lng: -71.481059 },
            { lat: -16.414957, lng: -71.482207 },
            { lat: -16.414822, lng: -71.785893 },
            { lat: -16.416374, lng: -71.491533 },
            { lat: -16.417192, lng: -71.490997 },
            { lat: -16.421863, lng: -71.498269 },
            { lat: -16.421304, lng: -71.499081 },
            { lat: -16.419698, lng: -71.501462 },
            { lat: -16.419196, lng: -71.502238 },
            { lat: -16.416961, lng: -71.505599 },
            { lat: -16.413997, lng: -71.510035 },
            { lat: -16.411856, lng: -71.512615 },
            { lat: -16.407584, lng: -71.514463 },
            { lat: -16.401931, lng: -71.517658 },
            { lat: -16.401852, lng: -71.524443 },
            { lat: -16.404277, lng: -71.527423 },
            { lat: -16.416436, lng: -71.533493 },
            { lat: -16.425214, lng: -71.533381 },
            { lat: -16.424623, lng: -71.537356 },
            { lat: -16.422482, lng: -71.543998 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta16'
    },

    Ruta16_Vuelta: {
        solicitud: {
            origin: { lat: -16.422519, lng: -71.544020 },
            destination: { lat: -16.416442, lng: -71.481015 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.422261, lng: -71.544020 }, stopover: true },
                { location: { lat: -16.417168, lng: -71.532936 }, stopover: true },
                { location: { lat: -16.408703, lng: -71.537064 }, stopover: true },
                { location: { lat: -16.398090, lng: -71.523896 }, stopover: true },
                { location: { lat: -16.402931, lng: -71.516571 }, stopover: true },
                { location: { lat: -16.411828, lng: -71.512655 }, stopover: true },
                { location: { lat: -16.421610, lng: -71.498737 }, stopover: true },
                { location: { lat: -16.421903, lng: -71.498309 }, stopover: true },
                { location: { lat: -16.415875, lng: -71.488988 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.422482, lng: -71.543998 },
            { lat: -16.420349, lng: -71.538283 },
            { lat: -16.416409, lng: -71.533253 },
            { lat: -16.410596, lng: -71.532804 },
            { lat: -16.409501, lng: -71.533615 },
            { lat: -16.404901, lng: -71.532332 },
            { lat: -16.402540, lng: -71.529401 },
            { lat: -16.400045, lng: -71.526315 },
            { lat: -16.398129, lng: -71.523925 },
            { lat: -16.401035, lng: -71.519330 },
            { lat: -16.402709, lng: -71.516916 },
            { lat: -16.411832, lng: -71.512658 },
            { lat: -16.416808, lng: -71.505883 },
            { lat: -16.419231, lng: -71.502285 },
            { lat: -16.420963, lng: -71.499699 },
            { lat: -16.421624, lng: -71.498756 },
            { lat: -16.421904, lng: -71.498309 },
            { lat: -16.417192, lng: -71.490994 },
            { lat: -16.414970, lng: -71.482243 },
            { lat: -16.415687, lng: -71.481059 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta16'
    },

    Ruta17_Ida: {
        solicitud: {
            origin: { lat: -16.457464, lng: -71.553470 },
            destination: { lat: -16.404315, lng: -71.527522 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.454059, lng: -71.551968 }, stopover: true },
                { location: { lat: -16.451607, lng: -71.554851 }, stopover: true },
                { location: { lat: -16.447824, lng: -71.551574 }, stopover: true },
                { location: { lat: -16.434616, lng: -71.562092 }, stopover: true },
                { location: { lat: -16.431590, lng: -71.561459 }, stopover: true },
                { location: { lat: -16.417561, lng: -71.549722 }, stopover: true },
                { location: { lat: -16.405861, lng: -71.540140 }, stopover: true },
                { location: { lat: -16.408914, lng: -71.537491 }, stopover: true },
                { location: { lat: -16.402557, lng: -71.529386 }, stopover: true },
                { location: { lat: -16.404315, lng: -71.527522 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.454059, lng: -71.551968 },
            { lat: -16.451607, lng: -71.554851 },
            { lat: -16.449373, lng: -71.552765 },
            { lat: -16.447824, lng: -71.551574 },
            { lat: -16.445044, lng: -71.553789 },
            { lat: -16.440109, lng: -71.558928 },
            { lat: -16.437178, lng: -71.561609 },
            { lat: -16.435799, lng: -71.562146 },
            { lat: -16.433926, lng: -71.561266 },
            { lat: -16.432270, lng: -71.559968 },
            { lat: -16.431590, lng: -71.561459 },
            { lat: -16.425467, lng: -71.556556 },
            { lat: -16.417561, lng: -71.549722 },
            { lat: -16.408094, lng: -71.541803 },
            { lat: -16.405833, lng: -71.540123 },
            { lat: -16.407579, lng: -71.538789 },
            { lat: -16.408788, lng: -71.537813 },
            { lat: -16.407687, lng: -71.535737 },
            { lat: -16.404857, lng: -71.532234 },
            { lat: -16.402557, lng: -71.529376 },
            { lat: -16.404315, lng: -71.527522 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta17'
    },

    Ruta17_Vuelta: {
        solicitud: {
            origin: { lat: -16.404315, lng: -71.527522 },
            destination: { lat: -16.457464, lng: -71.553470 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.411115, lng: -71.535698 }, stopover: true },
                { location: { lat: -16.408914, lng: -71.537491 }, stopover: true },
                { location: { lat: -16.405850, lng: -71.539978 }, stopover: true },
                { location: { lat: -16.418026, lng: -71.550320 }, stopover: true },
                { location: { lat: -16.431590, lng: -71.561459 }, stopover: true },
                { location: { lat: -16.434616, lng: -71.562092 }, stopover: true },
                { location: { lat: -16.447824, lng: -71.551574 }, stopover: true },
                { location: { lat: -16.451607, lng: -71.554851 }, stopover: true },
                { location: { lat: -16.454059, lng: -71.551968 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.404315, lng: -71.527522 },
            { lat: -16.409945, lng: -71.534394 },
            { lat: -16.409412, lng: -71.536441 },
            { lat: -16.409031, lng: -71.537289 },
            { lat: -16.407880, lng: -71.538376 },
            { lat: -16.405765, lng: -71.540001 },
            { lat: -16.408011, lng: -71.541922 },
            { lat: -16.416775, lng: -71.549205 },
            { lat: -16.421719, lng: -71.553746 },
            { lat: -16.431313, lng: -71.561545 },
            { lat: -16.431679, lng: -71.561626 },
            { lat: -16.432389, lng: -71.560086 },
            { lat: -16.435113, lng: -71.562212 },
            { lat: -16.436321, lng: -71.562189 },
            { lat: -16.440143, lng: -71.559143 },
            { lat: -16.443101, lng: -71.555940 },
            { lat: -16.447744, lng: -71.551620 },
            { lat: -16.448796, lng: -71.552552 },
            { lat: -16.450012, lng: -71.553416 },
            { lat: -16.453984, lng: -71.552040 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta17'
    },

    Ruta18_Ida: {
        solicitud: {
            origin: { lat: -16.424818, lng: -71.672601 },
            destination: { lat: -16.424818, lng: -71.672601 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.413653, lng: -71.638104 }, stopover: true },
                { location: { lat: -16.404703, lng: -71.573538 }, stopover: true },
                { location: { lat: -16.406437, lng: -71.563684 }, stopover: true },
                { location: { lat: -16.408112, lng: -71.560480 }, stopover: true },
                { location: { lat: -16.417835, lng: -71.549945 }, stopover: true },
                { location: { lat: -16.405980, lng: -71.540121 }, stopover: true },
                { location: { lat: -16.408849, lng: -71.537155 }, stopover: true },
                { location: { lat: -16.402629, lng: -71.529443 }, stopover: true },
                { location: { lat: -16.400118, lng: -71.526278 }, stopover: true },
                { location: { lat: -16.401924, lng: -71.524605 }, stopover: true },
                { location: { lat: -16.403977, lng: -71.527158 }, stopover: true },
                { location: { lat: -16.409911, lng: -71.534352 }, stopover: true },
                { location: { lat: -16.409417, lng: -71.536417 }, stopover: true },
                { location: { lat: -16.405720, lng: -71.540101 }, stopover: true },
                { location: { lat: -16.412811, lng: -71.545503 }, stopover: true },
                { location: { lat: -16.415304, lng: -71.542419 }, stopover: true },
                { location: { lat: -16.418348, lng: -71.542906 }, stopover: true },
                { location: { lat: -16.419220, lng: -71.543721 }, stopover: true },
                { location: { lat: -16.418519, lng: -71.544588 }, stopover: true },
                { location: { lat: -16.417874, lng: -71.546329 }, stopover: true },
                { location: { lat: -16.419007, lng: -71.547542 }, stopover: true },
                { location: { lat: -16.418350, lng: -71.548291 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.424818, lng: -71.672601 },
            { lat: -16.412088, lng: -71.632504 },
            { lat: -16.407951, lng: -71.608429 },
            { lat: -16.406695, lng: -71.600124 },
            { lat: -16.405934, lng: -71.587915 },
            { lat: -16.405584, lng: -71.585040 },
            { lat: -16.404703, lng: -71.573538 },
            { lat: -16.404445, lng: -71.568290 },
            { lat: -16.406437, lng: -71.563684 },
            { lat: -16.408112, lng: -71.560480 },
            { lat: -16.417938, lng: -71.549350 },
            { lat: -16.417835, lng: -71.549945 },
            { lat: -16.412230, lng: -71.545110 },
            { lat: -16.408253, lng: -71.541921 },
            { lat: -16.405980, lng: -71.540121 },
            { lat: -16.408849, lng: -71.537155 },
            { lat: -16.407760, lng: -71.535784 },
            { lat: -16.404960, lng: -71.532303 },
            { lat: -16.402629, lng: -71.529443 },
            { lat: -16.400118, lng: -71.526278 }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta18'
    },

    Ruta18_Vuelta: {
        solicitud: {
            origin: { lat: -16.424818, lng: -71.672601 },
            destination: { lat: -16.424818, lng: -71.672601 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.413653, lng: -71.638104 }, stopover: true },
                { location: { lat: -16.404703, lng: -71.573538 }, stopover: true },
                { location: { lat: -16.406437, lng: -71.563684 }, stopover: true },
                { location: { lat: -16.408112, lng: -71.560480 }, stopover: true },
                { location: { lat: -16.417835, lng: -71.549945 }, stopover: true },
                { location: { lat: -16.405980, lng: -71.540121 }, stopover: true },
                { location: { lat: -16.408849, lng: -71.537155 }, stopover: true },
                { location: { lat: -16.402629, lng: -71.529443 }, stopover: true },
                { location: { lat: -16.400118, lng: -71.526278 }, stopover: true },
                { location: { lat: -16.401924, lng: -71.524605 }, stopover: true },
                { location: { lat: -16.403977, lng: -71.527158 }, stopover: true },
                { location: { lat: -16.409911, lng: -71.534352 }, stopover: true },
                { location: { lat: -16.409417, lng: -71.536417 }, stopover: true },
                { location: { lat: -16.405720, lng: -71.540101 }, stopover: true },
                { location: { lat: -16.412811, lng: -71.545503 }, stopover: true },
                { location: { lat: -16.415304, lng: -71.542419 }, stopover: true },
                { location: { lat: -16.418348, lng: -71.542906 }, stopover: true },
                { location: { lat: -16.419220, lng: -71.543721 }, stopover: true },
                { location: { lat: -16.418519, lng: -71.544588 }, stopover: true },
                { location: { lat: -16.417874, lng: -71.546329 }, stopover: true },
                { location: { lat: -16.419007, lng: -71.547542 }, stopover: true },
                { location: { lat: -16.418350, lng: -71.548291 }, stopover: true }
            ]
        },
        paradas: [
            { lat: -16.400118, lng: -71.526278 },
            { lat: -16.401924, lng: -71.524605 },
            { lat: -16.403977, lng: -71.527158 },
            { lat: -16.405487, lng: -71.528924 },
            { lat: -16.406833, lng: -71.530515 },
            { lat: -16.408721, lng: -71.532890 },
            { lat: -16.409911, lng: -71.534352 },
            { lat: -16.409417, lng: -71.536417 },
            { lat: -16.405720, lng: -71.540101 },
            { lat: -16.408170, lng: -71.542015 },
            { lat: -16.411965, lng: -71.545157 },
            { lat: -16.412778, lng: -71.545521 },
            { lat: -16.415261, lng: -71.542467 },
            { lat: -16.418355, lng: -71.542923 },
            { lat: -16.418348, lng: -71.542906 },
            { lat: -16.419220, lng: -71.543721 },
            { lat: -16.417874, lng: -71.546329 },
            { lat: -16.419007, lng: -71.547542 },
            { lat: -16.418350, lng: -71.548291 },
            { lat: -16.418075, lng: -71.548850 }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta18'
    }
}

function toggleDropdown() {
    const dropdownContent = document.getElementById('dropdownContent');
    dropdownContent.classList.toggle('show');
}

function handleCheckboxChange(ruta) {
    toggleRuta(ruta);
}

function agregarRuta(solicitud, color, paradasAutobus, ruta) {
    var renderizador = new google.maps.DirectionsRenderer({
        polylineOptions: {
            strokeColor: color
        },
        //suppressMarkers: true
    });
    renderizador.setMap(mapa);
    servicioDirecciones.route(solicitud, function (resultado, estado) {
        if (estado === 'OK') {
            renderizador.setDirections(resultado);
            paradasAutobus.forEach(function (parada) {
                var marcador = createMarker(parada, color);
                marcadores[ruta].push(marcador);
            });
        } else {
            window.alert('Error al obtener la ruta: ' + estado);
        }
    });
    renderizadores[ruta].push(renderizador);
}


function toggleRuta(ruta) {
    if (!renderizadores[ruta]) {
        renderizadores[ruta] = [];
    }
    if (!marcadores[ruta]) {
        marcadores[ruta] = [];
    }

    var checkBox = document.getElementById(`checkbox${ruta.replace('Ruta', '')}`);
    if (checkBox.checked) {
        RutaIda = GetRoute(ruta, 'Ida');
        RutaVuelta = GetRoute(ruta, 'Vuelta');
        agregarRuta(RutaIda.solicitud, 'green', RutaIda.paradas, ruta);
        agregarRuta(RutaVuelta.solicitud, 'blue', RutaVuelta.paradas, ruta);
    } else {
        limpiarRuta(ruta);
    }
}

function limpiarRuta(ruta) {
    renderizadores[ruta].forEach(function (renderizador) {
        renderizador.setMap(null);
    });
    renderizadores[ruta] = [];

    marcadores[ruta].forEach(function (marcador) {
        marcador.setMap(null);
    });
    marcadores[ruta] = [];
}
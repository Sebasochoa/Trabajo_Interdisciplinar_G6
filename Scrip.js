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
    cargarParaderos(paradas1Ruta1, "Ruta1", "Ida");
    cargarParaderos(paradas2Ruta1, "Ruta1", "Vuelta");

    cargarParaderos(paradas1Ruta3, "Ruta3", "Ida");
    cargarParaderos(paradas1Ruta4, "Ruta4", "Ida");
    cargarParaderos(paradas2Ruta4, "Ruta4", "Vuelta");
    cargarParaderos(paradas1Ruta5, "Ruta5", "Ida");
    cargarParaderos(paradas2Ruta5, "Ruta5", "Vuelta");
    cargarParaderos(paradas1Ruta6, "Ruta6", "Ida");
    cargarParaderos(paradas2Ruta6, "Ruta6", "Vuelta");
    cargarParaderos(paradas1Ruta9, "Ruta9", "Ida");
    cargarParaderos(paradas2Ruta9, "Ruta9", "Vuelta");
    cargarParaderos(paradas1Ruta10, "Ruta10", "Ida");
    cargarParaderos(paradas2Ruta10, "Ruta10", "Vuelta");
    cargarParaderos(paradas1Ruta11, "Ruta11", "Ida");
    cargarParaderos(paradas1Ruta12, "Ruta12", "Ida");
    cargarParaderos(paradas2Ruta12, "Ruta12", "Vuelta");
    cargarParaderos(paradas1Ruta13, "Ruta13", "Ida");
    cargarParaderos(paradas2Ruta13, "Ruta13", "Vuelta");
    cargarParaderos(paradas1Ruta14, "Ruta14", "Ida");
    cargarParaderos(paradas2Ruta14, "Ruta14", "Vuelta");
    cargarParaderos(paradas1Ruta15, "Ruta15", "Ida");
    cargarParaderos(paradas2Ruta15, "Ruta15", "Vuelta");
    cargarParaderos(paradas1Ruta16, "Ruta16", "Ida");
    cargarParaderos(paradas2Ruta16, "Ruta16", "Vuelta");
    cargarParaderos(paradas1Ruta17, "Ruta17", "Vuelta");
    cargarParaderos(paradas2Ruta17, "Ruta17", "Ida");
    cargarParaderos(paradas1Ruta18, "Ruta18", "Ida");
    cargarParaderos(paradas2Ruta18, "Ruta18", "Vuelta");

}


function mostrarRutas(Ruta, ParaderoInicio, ParaderoFinal) {
    if (Ruta === 'Ruta1') {
        if (isCloserToStartorEnd(solicitud1Ruta1, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta1, "green", "Ruta1", paradas1Ruta1, ParaderoInicio, ParaderoFinal);
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta1, "blue", "Ruta1", paradas2Ruta1, ParaderoInicio, ParaderoFinal);
        }
    } else if (Ruta === 'Ruta2') {

    } else if (Ruta === 'Ruta3') {
        mostrarRutapersonalizada(solicitud1Ruta3, 'green', 'Ruta3', paradas1Ruta3, ParaderoInicio, ParaderoFinal);
    } else if (Ruta === 'Ruta4') {
        if (isCloserToStartorEnd(solicitud1Ruta4, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta4, 'green', "Ruta4", paradas1Ruta4, ParaderoInicio, ParaderoFinal)
        } else {
            mostrarRutapersonalizada(solicitud2Ruta4, 'blue', "Ruta4", paradas2Ruta4, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta5') {
        if (isCloserToStartorEnd(solicitud1Ruta5, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta5, 'green', "Ruta5", paradas1Ruta5, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta5, 'blue', "Ruta5", paradas2Ruta5, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta6') {
        if (isCloserToStartorEnd(solicitud1Ruta6, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta6, 'green', "Ruta6", paradas1Ruta6, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud1Ruta6, 'blue', "Ruta6", paradas2Ruta6, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta7') {
        mostrarRuta7();
    } else if (Ruta === 'Ruta8') {
        mostrarRuta8();
    } else if (Ruta === 'Ruta9') {
        if (isCloserToStartorEnd(solicitud1Ruta9, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta9, 'green', "Ruta9", paradas1Ruta9, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta9, 'blue', "Ruta9", paradas2Ruta9, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta10') {
        if (isCloserToStartorEnd(solicitud1Ruta10, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta10, 'green', "Ruta10", paradas1Ruta10, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta10, 'blue', "Ruta10", paradas2Ruta10, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta11') {
        if (isCloserToStartorEnd(solicitud1Ruta11, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta11, 'green', "Ruta11", paradas1Ruta11, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud1Ruta11, 'green', "Ruta11", paradas1Ruta11, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta12') {
        if (isCloserToStartorEnd(solicitud1Ruta12, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta12, 'green', "Ruta12", paradas1Ruta12, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta12, 'blue', "Ruta12", paradas2Ruta12, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta13') {
        if (isCloserToStartorEnd(solicitud1Ruta13, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta13, 'green', "Ruta13", paradas1Ruta13, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta13, 'blue', "Ruta13", paradas2Ruta13, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta14') {
        if (isCloserToStartorEnd(solicitud1Ruta14, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta14, 'green', "Ruta14", paradas1Ruta14, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta14, 'blue', "Ruta14", paradas2Ruta14, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta15') {
        if (isCloserToStartorEnd(solicitud1Ruta15, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta15, 'green', "Ruta15", paradas1Ruta15, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta15, 'blue', "Ruta15", paradas2Ruta15, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta16') {
        if (isCloserToStartorEnd(solicitud1Ruta16, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta16, 'green', "Ruta16", paradas1Ruta16, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta16, 'blue', "Ruta16", paradas2Ruta16, ParaderoInicio, ParaderoFinal)
        }
    } else if (Ruta === 'Ruta17') {

        if (isCloserToStartorEnd(solicitud1Ruta17, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta17, 'green', "Ruta17", paradas1Ruta17, ParaderoInicio, ParaderoFinal);
        }
        else {
            mostrarRutapersonalizada(solicitud2Ruta17, 'blue', "Ruta17", paradas2Ruta17, ParaderoInicio, ParaderoFinal);
        }
    } else if (Ruta === 'Ruta18') {
        if (isCloserToStartorEnd(solicitud1Ruta18, ParaderoInicio)) {
            mostrarRutapersonalizada(solicitud1Ruta18, 'green', "Ruta6", paradas1Ruta18, ParaderoInicio, ParaderoFinal)
        }
        else {
            mostrarRutapersonalizada(solicitud1Ruta18, 'blue', "Ruta6", paradas2Ruta18, ParaderoInicio, ParaderoFinal)
        }
    }
}

function limpiarRuta() {
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
    limpiarRuta();
    borrarRutas();
    get_paraderocercano();
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
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

//FUNCION MEJORADA PARA MOSTRAR MAS DE UNA RUTA AL DESTINO
function get_paraderocercano() {
    if (destinoMarcador && ubicacion) {
        let posicionDestino = destinoMarcador.getPosition();
        let posicionInicial = ubicacion.getPosition();
        let rutasCercanasADestino = new Map();
        let rutasCercanasAUbicacion = new Map();

        // Buscar paraderos cercanos a la posición del destinoMarcador
        for (let ruta in paraderos) {
            if (paraderos.hasOwnProperty(ruta)) {
                paraderos[ruta].forEach((marcador) => {
                    const distance = haversineDistance(posicionDestino.lat(), posicionDestino.lng(), marcador.parada.lat, marcador.parada.lng);
                    if (distance < 0.5) {
                        addValueToMap(rutasCercanasADestino, ruta, marcador.id);
                    }
                });
            }
        }
        // Buscar paraderos cercanos a la ubicación inicial
        for (let ruta in paraderos) {
            if (paraderos.hasOwnProperty(ruta)) {
                paraderos[ruta].forEach((marcador) => {
                    const distance = haversineDistance(posicionInicial.lat(), posicionInicial.lng(), marcador.parada.lat, marcador.parada.lng);
                    if (distance < 0.5) {
                        addValueToMap(rutasCercanasAUbicacion, ruta, marcador.id);
                    }
                });
            }
        }

        let result = containsAny(rutasCercanasAUbicacion, rutasCercanasADestino);

        if (result !== null) {
            nomruta = Object.keys(result);
            paraderofinal = null;
            mostrarRutas(nomruta[0], { lat: posicionInicial.lat(), lng: posicionInicial.lng() }, paraderofinal);
        }
        else {
            let distanciamascorta = Infinity;
            let coordenadasparaderos = {};
            let recorrido1;
            let recorrido2;
            rutasCercanasAUbicacion.forEach((setUbicacion, rutaubicacion) => {
                rutasCercanasADestino.forEach((setDestino, rutadestino) => {
                    if (paraderos.hasOwnProperty(rutaubicacion) && paraderos.hasOwnProperty(rutadestino)) {
                        paraderos[rutaubicacion].forEach((coordenada1) => {
                            paraderos[rutadestino].forEach((coordenada2) => {
                                const distance = haversineDistance(coordenada1.parada.lat, coordenada1.parada.lng, coordenada2.parada.lat, coordenada2.parada.lng);
                                if (distance < 0.1 && distance < distanciamascorta) {
                                    distanciamascorta = distance;
                                    coordenadasparaderos = {};
                                    coordenadasparaderos[rutaubicacion] = { lat: coordenada1.parada.lat, lng: coordenada1.parada.lng };
                                    coordenadasparaderos[rutadestino] = { lat: coordenada2.parada.lat, lng: coordenada2.parada.lng };
                                    recorrido1 = coordenada1.id;
                                    recorrido2 = coordenada2.id;
                                }
                            });
                        });
                    }
                });
            });
            let rutas = Object.keys(coordenadasparaderos);
            console.log(rutas[0]);
            console.log(rutas[1]);
            mostrarRutas(rutas[0], paradacercana(rutas[0], recorrido1, posicionInicial.lat(), posicionInicial.lng()), paradacercana(rutas[0], recorrido1, coordenadasparaderos[rutas[1]].lat, coordenadasparaderos[rutas[1]].lng));
            mostrarRutas(rutas[1], coordenadasparaderos[rutas[1]], paradacercana(rutas[1], recorrido2, posicionDestino.lat(), posicionDestino.lng()));
            mostrarrutacaminando(rutas[0] + rutas[1], paradacercana(rutas[0], recorrido1, posicionInicial.lat(), posicionInicial.lng()), paradacercana(rutas[1], recorrido2, posicionDestino.lat(), posicionDestino.lng()))

        }
    }
}

function paradacercana(ruta, recorrido, lat, lng) {
    let distanciamascorta = Infinity;
    let coordenadasparaderos = {};
    paraderos[ruta].forEach((marcador) => {
        if (marcador.id === recorrido) {
            let distance = haversineDistance(lat, lng, marcador.parada.lat, marcador.parada.lng);
            if (distance < distanciamascorta) {
                distanciamascorta = distance;
                coordenadasparaderos = {};
                coordenadasparaderos = { lat: marcador.parada.lat, lng: marcador.parada.lng };
            }
        }
    });
    return coordenadasparaderos;
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


function calcularPuntoMedio(lat1, lon1, lat2, lon2) {
    const lat_media = (lat1 + lat2) / 2;
    const lon_media = (lon1 + lon2) / 2;
    return { lat: lat_media, lng: lon_media };
}

function modificarsolicitud(solicitud, paraderoinicio, paraderofinal) {
    let nuevoswaypoints = [];
    distanciamaximainicio = haversineDistance(solicitud.origin.lat, solicitud.origin.lng, paraderoinicio.lat, paraderoinicio.lng);
    distanciamaximafinal = haversineDistance(solicitud.destination.lat, solicitud.destination.lng, paraderofinal.lat, paraderofinal.lng);
    puntomedio = calcularPuntoMedio(paraderoinicio.lat, paraderofinal.lng, paraderofinal.lat, paraderofinal.lng);
    puntomedioaextremos = haversineDistance(paraderoinicio.lat, paraderofinal.lng, puntomedio.lat, puntomedio.lng);
    solicitud.waypoints.forEach(function (waypoint) {
        let distanciacoordenada1 = haversineDistance(solicitud.origin.lat, solicitud.origin.lng, waypoint.location.lat, waypoint.location.lng);
        let distanciacoordenada2 = haversineDistance(solicitud.destination.lat, solicitud.destination.lng, waypoint.location.lat, waypoint.location.lng);
        if ((distanciacoordenada1 > distanciamaximainicio) && (distanciacoordenada2 > distanciamaximafinal) || (haversineDistance(puntomedio.lat, puntomedio.lng, waypoint.location.lat, waypoint.location.lng) < puntomedioaextremos)) {
            nuevoswaypoints.push(waypoint);
        }
    });

    // Crear una copia superficial del objeto solicitud
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
                        reject('No se encontró el nombre de la calle');
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



function mostrarRutapersonalizada(solicitud, color, nombreRuta, paraderos, paraderoinicio, paraderofinal) {
    if (paraderofinal !== null) {
        if (nombreRuta == "Ruta11") {
            window.alert(`Mostrando Ruta B-POLANCO`);
        }
        // Mostrar el nombre de la ruta en algún lugar de la interfaz

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
        let nuevasolicitud = modificarsolicitud(solicitud, paraderoinicio, paraderofinal);
        renderizador.setMap(mapa);
        servicioDirecciones.route(nuevasolicitud, function (resultado, estado) {
            if (estado === 'OK') {
                renderizador.setDirections(resultado);
                marcadores[nombreRuta].push(createMarker({ lat: paraderoinicio.lat, lng: paraderoinicio.lng }));
                marcadores[nombreRuta].push(createMarker({ lat: paraderofinal.lat, lng: paraderofinal.lng }));
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
                //console.error('Error al obtener el nombre de la calle:', error);
            }
        }

        obtenerYAlmacenarNombreCalle().then(() => { });
    }
    else {
        let posicionDestino = destinoMarcador.getPosition();
        let posicionInicial = ubicacion.getPosition();
        let distanciamascortainicio = Infinity;
        let distanciamascortafinal = Infinity;
        let paraderoinicior = {};
        let paraderofinalr = {};
        paraderos.forEach((coordenada) => {

            const distanciainicio = haversineDistance(posicionInicial.lat(), posicionInicial.lng(), coordenada.lat, coordenada.lng);
            const distanciafinal = haversineDistance(posicionDestino.lat(), posicionDestino.lng(), coordenada.lat, coordenada.lng);

            if (distanciainicio < distanciamascortainicio) {
                distanciamascortainicio = distanciainicio;
                paraderoinicior = {};
                paraderoinicior = { lat: coordenada.lat, lng: coordenada.lng };
            }
            if (distanciafinal < distanciamascortafinal) {
                distanciamascortafinal = distanciafinal;
                paraderofinalr = {};
                paraderofinalr = { lat: coordenada.lat, lng: coordenada.lng };
            }

        });
        if (nombreRuta == "Ruta11") {
            window.alert(`Mostrando Ruta B-POLANCO`);
        }
        // Mostrar el nombre de la ruta en algún lugar de la interfaz

        if (!renderizadores[nombreRuta]) {
            renderizadores[nombreRuta] = [];
        }

        if (!marcadores[nombreRuta]) {
            marcadores[nombreRuta] = [];
        }
        mostrarrutacaminando(nombreRuta, paraderoinicior, paraderofinalr);

        var renderizador = new google.maps.DirectionsRenderer({
            polylineOptions: {
                strokeColor: color
            },
            suppressMarkers: true
        });


        nuevasolicitud = modificarsolicitud(solicitud, paraderoinicior, paraderofinalr);
        renderizador.setMap(mapa);
        servicioDirecciones.route(nuevasolicitud, function (resultado, estado) {
            if (estado === 'OK') {
                renderizador.setDirections(resultado);
                marcadores[nombreRuta].push(createMarker({ lat: paraderoinicior.lat, lng: paraderoinicior.lng }));
                marcadores[nombreRuta].push(createMarker({ lat: paraderofinalr.lat, lng: paraderofinalr.lng }));

            } else {
                window.alert('Error al obtener la ruta: ' + estado);
            }
        });
        renderizadores[nombreRuta].push(renderizador);
        let calleinicio = null;
        let callefinal = null
        async function obtenerYAlmacenarNombreCalle() {
            try {
                calleinicio = await obtenerNombreCalle(paraderoinicior.lat, paraderoinicior.lng);
                callefinal = await obtenerNombreCalle(paraderofinalr.lat, paraderofinalr.lng);
                mostrarNombreRutaEnInterfaz(nombreRuta, calleinicio, callefinal);
            } catch (error) {
                console.error('Error al obtener el nombre de la calle:', error);
                calleinicio = null;
            }
        }

        obtenerYAlmacenarNombreCalle().then(() => { });

    }
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

function createMarker(parada) {
    return new google.maps.Marker({
        position: parada,
        map: mapa,
        title: 'Parada de Autobús',
        icon: {
            url: 'paradero.png',
            scaledSize: new google.maps.Size(15, 20)
        }
    });
}
var solicitud1Ruta1 = {
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
};
var solicitud2Ruta1 = {
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
};
var paradas1Ruta1 = [
    { lat: -16.389402, lng: -71.574932 },
    { lat: -16.397699, lng: -71.575094 },
    { lat: -16.399962, lng: 71.5705972 },
    { lat: -16.393322, lng: 71.5682076 },
    { lat: -16.392772, lng: 71.5602698 },
    { lat: -16.392710, lng: -71.556940 },
    { lat: -16.388102, lng: 71.5520456 },
    { lat: -16.389097, lng: -71.549339 },
    { lat: -16.390184, lng: -71.546413 },
    { lat: -16.392248, lng: -71.540735 },
    { lat: -16.393023, lng: -71.536599 },
    { lat: -16.393349, lng: -71.535529 },
    { lat: -16.391902, lng: 71.5324266 },
    { lat: -16.394210, lng: -71.530851 },
    { lat: -16.399398, lng: 1.52179080 },
    { lat: -16.402912, lng: -71.516663 },
    { lat: -16.415587, lng: -71.515251 },
    { lat: -16.425626, lng: -71.514997 },
    { lat: -16.430518, lng: -71.532659 },
    { lat: -16.429032, lng: -71.523981 }
];
var paradas2Ruta1 = [
    { lat: -16.427124, lng: -71.532956 },
    { lat: -16.424925, lng: -71.533091 },
    { lat: -16.415159, lng: -71.5340559 },
    { lat: -16.412611, lng: -71.535092 },
    { lat: -16.407767, lng: -71.5385793 },
    { lat: -16.405729, lng: -71.5400113 },
    { lat: -16.399908, lng: -71.5421171 },
    { lat: -16.396656, lng: -71.545194 },
    { lat: -16.395264, lng: -71.548209 },
    { lat: -16.393445, lng: -71.549074 },
    { lat: -16.389840, lng: -71.5476133 },
    { lat: -16.390184, lng: -71.546413 },
    { lat: -16.389097, lng: -71.549339 },
    { lat: -16.388102, lng: - 71.5520456 },
    { lat: -16.392710, lng: -71.556940 },
    { lat: -16.392772, lng: -71.5602698 },
    { lat: -16.393322, lng: -71.5682076 },
    { lat: -16.399962, lng: -71.5705972 },
    { lat: -16.397699, lng: -71.575094 }
];



function mostrarRuta2() {
    var puntoInicio = { lat: -16.456918, lng: -71.521800 };
    var puntoDestino = { lat: -16.404364, lng: -71.531719 };

    var solicitud5 = {
        origin: puntoInicio,
        destination: puntoDestino,
        travelMode: 'DRIVING',
        waypoints: [
            { location: { lat: -16.456769, lng: -71.522311 }, stopover: true },
            { location: { lat: -16.457615, lng: -71.522916 }, stopover: true },
            { location: { lat: -16.459352, lng: -71.524844 }, stopover: true },
            { location: { lat: -16.461726, lng: -71.527814 }, stopover: true },
            { location: { lat: -16.452505, lng: -71.531106 }, stopover: true },
            { location: { lat: -16.454044, lng: -71.532800 }, stopover: true },
            { location: { lat: -16.452428, lng: -71.532099 }, stopover: true },
            { location: { lat: -16.450620, lng: -71.533212 }, stopover: true },
            { location: { lat: -16.449968, lng: -71.532879 }, stopover: true },
            { location: { lat: -16.449375, lng: -71.533921 }, stopover: true },
            { location: { lat: -16.441977, lng: -71.528833 }, stopover: true },
            { location: { lat: -16.440223, lng: -71.525778 }, stopover: true },
            { location: { lat: -16.438672, lng: -71.525547 }, stopover: true },
            { location: { lat: -16.438642, lng: -71.521694 }, stopover: true },
            { location: { lat: -16.437814, lng: -71.521232 }, stopover: true },
            { location: { lat: -16.436558, lng: -71.521124 }, stopover: true },
            { location: { lat: -16.429265, lng: -71.523607 }, stopover: true },
            { location: { lat: -16.420026, lng: -71.516675 }, stopover: true },
            { location: { lat: -16.404955, lng: -71.526690 }, stopover: true },
            { location: { lat: -16.404167, lng: -71.530454 }, stopover: true }
        ]
    };
    var paradasAutobus = [
        // Lista de coordenadas de paradas de autobús para la ruta 5
    ];
    agregarRuta(solicitud5, 'green', paradasAutobus, 'Ruta2');
}



var solicitud1Ruta3 = {
    origin: { lat: -16.376844, lng: -71.498962 },
    destination: { lat: -16.376844, lng: -71.498962 },
    travelMode: 'DRIVING',
    waypoints: [
        { location: { lat: -16.375523, lng: -71.499737 }, stopover: true },
        { location: { lat: -16.375273, lng: -71.499111 }, stopover: true },
        { location: { lat: -16.375273, lng: -71.499111 }, stopover: true },
        { location: { lat: -16.374880, lng: -71.499009 }, stopover: true },
        { location: { lat: -16.373694, lng: -71.502135 }, stopover: true },
        { location: { lat: -16.373035, lng: -71.502874 }, stopover: true },
        { location: { lat: -16.374229, lng: -71.504492 }, stopover: true },
        { location: { lat: -16.375801, lng: -71.506863 }, stopover: true },
        { location: { lat: -16.377004, lng: -71.508628 }, stopover: true },
        { location: { lat: -16.379955, lng: -71.509535 }, stopover: true },
        { location: { lat: -16.382708, lng: -71.511775 }, stopover: true },
        { location: { lat: -16.386294, lng: -71.514814 }, stopover: true },
        { location: { lat: -16.387920, lng: -71.516201 }, stopover: true },
        { location: { lat: -16.390852, lng: -71.518683 }, stopover: true },
        { location: { lat: -16.393130, lng: -71.520604 }, stopover: true },
        { location: { lat: -16.394169, lng: -71.521464 }, stopover: true },
        { location: { lat: -16.393553, lng: -71.522717 }, stopover: true },
        { location: { lat: -16.395475, lng: -71.523999 }, stopover: true },
        { location: { lat: -16.397155, lng: -71.525155 }, stopover: true },
        { location: { lat: -16.398224, lng: -71.526689 }, stopover: true },
        { location: { lat: -16.394322, lng: -71.52134 }, stopover: true },
        { location: { lat: -16.3799546, lng: -71.5095353 }, stopover: true },
        { location: { lat: -16.373128, lng: -71.502763 }, stopover: true }]
};
var paradas1Ruta3 = [
    { lat: -16.376845, lng: -71.498962 },
    { lat: -16.375523, lng: -71.499737 },
    { lat: -16.373631, lng: -71.501213 },
    { lat: -16.373694, lng: -71.502135 },
    { lat: -16.373035, lng: -71.502874 },
    { lat: -16.374229, lng: -71.504492 },
    { lat: -16.375801, lng: -71.506863 },
    { lat: -16.377004, lng: -71.508628 },
    { lat: -16.379955, lng: -71.509535 },
    { lat: -16.382708, lng: -71.511775 },
    { lat: -16.386294, lng: -71.514814 },
    { lat: -16.387920, lng: -71.516201 },
    { lat: -16.390852, lng: -71.518683 },
    { lat: -16.393130, lng: -71.520604 },
    { lat: -16.394169, lng: -71.521464 },
    { lat: -16.393553, lng: -71.522717 },
    { lat: -16.395475, lng: -71.523999 },
    { lat: -16.397155, lng: -71.525155 },
    { lat: -16.398224, lng: -71.526689 },
    { lat: -16.399557, lng: -71.528701 }

];


var solicitud1Ruta4 = {
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
        { location: { lat: -16.405606, lng: -71.539917 }, stopover: true }]
};
var solicitud2Ruta4 = {
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
        { location: { lat: -16.366885, lng: -71.501532 }, stopover: true }]
};
var paradas1Ruta4 = [
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

];
var paradas2Ruta4 = [
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

];





var solicitud1Ruta5 = {
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
        { location: { lat: -16.423100, lng: -71.541820 }, stopover: true },]
};
var solicitud2Ruta5 = {
    origin: { lat: -16.42560, lng: -71.53457 },
    destination: { lat: -16.37982, lng: -71.49182 },
    travelMode: 'DRIVING',
    waypoints: [
        { location: { lat: -16.426250, lng: -71.533750 }, stopover: true },
        { location: { lat: -16.426920, lng: -71.533040 }, stopover: true },
        { location: { lat: -16.417130, lng: -71.532670 }, stopover: true },
        { location: { lat: -16.412530, lng: -71.535120 }, stopover: true },
        { location: { lat: -16.407230, lng: -71.524710 }, stopover: true },
        { location: { lat: -16.399630, lng: -71.515360 }, stopover: true },
        { location: { lat: -16.399420, lng: -71.516680 }, stopover: true },
        { location: { lat: -16.398370, lng: -71.515930 }, stopover: true },
        { location: { lat: -16.394260, lng: -71.521400 }, stopover: true },
        { location: { lat: -16.380960, lng: -71.508440 }, stopover: true },
        { location: { lat: -16.381260, lng: -71.505380 }, stopover: true },
        { location: { lat: -16.382050, lng: -71.500610 }, stopover: true },
        { location: { lat: -16.378700, lng: -71.497590 }, stopover: true },
        { location: { lat: -16.378390, lng: -71.496310 }, stopover: true },
        { location: { lat: -16.378540, lng: -71.493530 }, stopover: true },]
};
var paradas1Ruta5 = [
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



];
var paradas2Ruta5 = [
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


];




var solicitud1Ruta6 = {
    origin: { lat: -16.376844, lng: -71.498962 },
    destination: { lat: -16.376844, lng: -71.498962 },
    travelMode: 'DRIVING',
    waypoints: [
        { location: { lat: -16.297600, lng: -71.626220 }, stopover: true },
        { location: { lat: -16.300780, lng: -71.621810 }, stopover: true },
        { location: { lat: -16.315390, lng: -71.606590 }, stopover: true },
        { location: { lat: -16.321600, lng: -71.598200 }, stopover: true },
        { location: { lat: -16.326900, lng: -71.595000 }, stopover: true },
        { location: { lat: -16.338900, lng: -71.590100 }, stopover: true },
        { location: { lat: -16.342300, lng: -71.585700 }, stopover: true },
        { location: { lat: -16.342400, lng: -71.585500 }, stopover: true },
        { location: { lat: -16.342800, lng: -71.581500 }, stopover: true },
        { location: { lat: -16.347300, lng: -71.581700 }, stopover: true },
        { location: { lat: -16.378900, lng: -71.574300 }, stopover: true },
        { location: { lat: -16.389600, lng: -71.582900 }, stopover: true },
        { location: { lat: -16.405800, lng: -71.584800 }, stopover: true },
        { location: { lat: -16.404400, lng: -71.567500 }, stopover: true },
        { location: { lat: -16.408400, lng: -71.559600 }, stopover: true },
        { location: { lat: -16.422820, lng: -71.543800 }, stopover: true },
        { location: { lat: -16.423050, lng: -71.541650 }, stopover: true },
        { location: { lat: -16.424850, lng: -71.537490 }, stopover: true }]
};

var paradas1Ruta6 = [
    { lat: -16.297320, lng: -71.626220 },
    { lat: -16.301394, lng: -71.621098 },
    { lat: -16.315400, lng: -71.606524 },
    { lat: -16.326935, lng: -71.594972 },
    { lat: -16.297320, lng: -71.626220 },
    { lat: -16.339921, lng: -71.589155 },
    { lat: -16.342666, lng: -71.583528 },
    { lat: -16.342657, lng: -71.582463 },
    { lat: -16.368956, lng: -71.576690 },
    { lat: -16.379030, lng: -71.574628 },
    { lat: -16.381518, lng: -71.576632 },
    { lat: -16.382510, lng: -71.577458 },
    { lat: -16.390010, lng: -71.582931 },
    { lat: -16.395416, lng: -71.583625 },
    { lat: -16.404320, lng: -71.584713 },
    { lat: -16.415909, lng: -71.551348 },
    { lat: -16.419220, lng: -71.547918 },
    { lat: -16.420255, lng: -71.546774 },
    { lat: -16.420255, lng: -71.546774 },
    { lat: -16.424119, lng: -71.539081 }
];

var paradas2Ruta6 = [
    { lat: -16.424119, lng: -71.539081 },
    { lat: -16.420255, lng: -71.546774 },
    { lat: -16.420255, lng: -71.546774 },
    { lat: -16.419220, lng: -71.547918 },
    { lat: -16.415909, lng: -71.551348 },
    { lat: -16.404320, lng: -71.584713 },
    { lat: -16.395416, lng: -71.583625 },
    { lat: -16.390010, lng: -71.582931 },
    { lat: -16.382510, lng: -71.577458 },
    { lat: -16.381518, lng: -71.576632 },
    { lat: -16.379030, lng: -71.574628 },
    { lat: -16.368956, lng: -71.576690 },
    { lat: -16.342657, lng: -71.582463 },
    { lat: -16.342666, lng: -71.583528 },
    { lat: -16.339921, lng: -71.589155 },
    { lat: -16.297320, lng: -71.626220 },
    { lat: -16.326935, lng: -71.594972 },
    { lat: -16.315400, lng: -71.606524 },
    { lat: -16.301394, lng: -71.621098 },
    { lat: -16.297320, lng: -71.626220 }

];




var solicitud1Ruta9 = {
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
        { location: { lat: -16.39401, lng: -71.50297 }, stopover: true },]
};
var solicitud2Ruta9 = {
    origin: { lat: -16.39400, lng: -71.50296 },
    destination: { lat: -16.46169, lng: -71.52431 },
    travelMode: 'DRIVING',
    waypoints: [
        { location: { lat: -16.39413, lng: -71.50298 }, stopover: true },
        { location: { lat: -16.39651, lng: -71.50832 }, stopover: true },
        { location: { lat: -16.39212, lng: -71.51385 }, stopover: true },
        { location: { lat: -16.390510, lng: -71.5183179 }, stopover: true },
        { location: { lat: -16.394208, lng: -71.5214306 }, stopover: true },
        { location: { lat: -16.3934248, lng: -71.5225910 }, stopover: true },
        { location: { lat: -16.40197, lng: -71.52699 }, stopover: true },
        { location: { lat: -16.41209, lng: -71.53527 }, stopover: true },
        { location: { lat: -16.41591, lng: -71.53386 }, stopover: true },
        { location: { lat: -16.43031, lng: -71.53444 }, stopover: true },
        { location: { lat: -16.44169, lng: -71.52904 }, stopover: true },
        { location: { lat: -16.44345, lng: -71.51847 }, stopover: true },
        { location: { lat: -16.45541, lng: -71.51644 }, stopover: true },]
};
var paradas1Ruta9 = [
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
];
var paradas2Ruta9 = [
    { lat: -16.394129, lng: -71.502966 },
    { lat: -16.393662, lng: -71.511054 },
    { lat: -16.390521, lng: -71.518365 },
    { lat: -16.393582, lng: -71.522671 },
    { lat: -16.397215, lng: -71.525116 },
    { lat: -16.400957, lng: -71.527633 },
    { lat: -16.404294, lng: -71.527421 },
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
];




var solicitud1Ruta10 = {
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
        { location: { lat: -16.40194, lng: -71.54705 }, stopover: true },]
};
var solicitud2Ruta10 = {
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
        { location: { lat: -16.42937, lng: -71.49279 }, stopover: true },]
};
var paradas1Ruta10 = [
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

];
var paradas2Ruta10 = [
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

];


var solicitud1Ruta11 = {
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
        { location: { lat: -16.416715, lng: -71.533292 }, stopover: true }]
};
var solicitud2Ruta11 = {
    origin: { lat: -16.423153, lng: -71.542591 },
    destination: { lat: -16.359427, lng: -71.509089 },
    travelMode: 'DRIVING',
    waypoints: [
        { location: { lat: -16.39413, lng: -71.50298 }, stopover: true },
        { location: { lat: -16.39651, lng: -71.50832 }, stopover: true },
        { location: { lat: -16.39212, lng: -71.51385 }, stopover: true },
        { location: { lat: -16.390510, lng: -71.5183179 }, stopover: true },
        { location: { lat: -16.394208, lng: -71.5214306 }, stopover: true },
        { location: { lat: -16.3934248, lng: -71.5225910 }, stopover: true },
        { location: { lat: -16.40197, lng: -71.52699 }, stopover: true },
        { location: { lat: -16.41209, lng: -71.53527 }, stopover: true },
        { location: { lat: -16.41591, lng: -71.53386 }, stopover: true },
        { location: { lat: -16.43031, lng: -71.53444 }, stopover: true },
        { location: { lat: -16.44169, lng: -71.52904 }, stopover: true },
        { location: { lat: -16.44345, lng: -71.51847 }, stopover: true },
        { location: { lat: -16.45541, lng: -71.51644 }, stopover: true },]
};

var paradas1Ruta11 = [
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


];




var solicitud1Ruta12 = {
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
        { location: { lat: -16.408893, lng: -71.532837 }, stopover: true }]
};
var solicitud2Ruta12 = {
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
        { location: { lat: -16.404836, lng: -71.498590 }, stopover: true }]
};
var paradas1Ruta12 = [
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


];
var paradas2Ruta12 = [
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


];




var solicitud1Ruta13 = {
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
        { location: { lat: -16.408467, lng: -71.527641 }, stopover: true },]
};
var solicitud2Ruta13 = {
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
        { location: { lat: -16.331683, lng: -71.541877 }, stopover: true },]
};
var paradas1Ruta13 = [
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



];
var paradas2Ruta13 = [
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



];



var solicitud1Ruta14 = {
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
        { location: { lat: -16.390425, lng: -71.547191 }, stopover: true },]
};
var solicitud2Ruta14 = {
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
        { location: { lat: -16.459727, lng: -71.522353 }, stopover: true },]
};
var paradas1Ruta14 = [
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
];
var paradas2Ruta14 = [
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
];



var solicitud1Ruta15 = {
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
        { location: { lat: -16.40588, lng: -71.53165 }, stopover: true },]
};
var solicitud2Ruta15 = {
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
        { location: { lat: -16.41523, lng: -71.49429 }, stopover: true },]
};
var paradas1Ruta15 = [
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
];
var paradas2Ruta15 = [
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
];




var solicitud1Ruta16 = {
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
        { location: { lat: -16.422519, lng: -71.544020 }, stopover: true },]
};
var solicitud2Ruta16 = {
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
        { location: { lat: -16.415875, lng: -71.488988 }, stopover: true },]
};
var paradas1Ruta16 = [
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

];
var paradas2Ruta16 = [
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

];




var solicitud1Ruta17 = {
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
        { location: { lat: -16.404315, lng: -71.527522 }, stopover: true },]
};
var solicitud2Ruta17 = {
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
        { location: { lat: -16.454059, lng: -71.551968 }, stopover: true },]
};

var paradas1Ruta17 = [
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
    { lat: -16.405854, lng: -71.540103 },
    { lat: -16.407579, lng: -71.538789 },
    { lat: -16.408788, lng: -71.537813 },
    { lat: -16.407687, lng: -71.535737 },
    { lat: -16.404857, lng: -71.532234 },
    { lat: -16.402557, lng: -71.529376 },
    { lat: -16.404315, lng: -71.527522 }

];
var paradas2Ruta17 = [
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
];



var solicitud1Ruta18 = {
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
        { location: { lat: -16.418350, lng: -71.548291 }, stopover: true }]
};
var paradas1Ruta18 = [
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



];
var paradas2Ruta18 = [
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

];

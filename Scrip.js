var mapa;
var ubicacion;
var servicioDirecciones;
var renderizadores = {};
var marcadores = {};
var paraderos = {};
var destinoMarcador;
let searchBox1, searchBox2;
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
}).catch((error) => {
    console.error('Error al cargar Google Maps:', error);
});

function initMap() {
    mapa = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -16.386904, lng: -71.574997 },
        zoom: 12
    });

    const permisoUbicacion = getCookie('permisoUbicacion') || localStorage.getItem('permisoUbicacion');

    if (permisoUbicacion) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            ubicacion = new google.maps.Marker({
                position: pos,
                map: mapa,
                draggable: true,
                title: "Tu ubicacion actual"
            });

            mapa.setCenter(pos);
        }, function () {
            handleLocationError(true, mapa);
        });
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            ubicacion = new google.maps.Marker({
                position: pos,
                map: mapa,
                draggable: true,
                title: "Tu ubicacion actual"
            });

            mapa.setCenter(pos);
            setCookie('permisoUbicacion', 'true', 365);
            localStorage.setItem('permisoUbicacion', 'true');
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

    const input1 = document.getElementById("pac-input");
    input1.style.display = 'inline-block';
    searchBox1 = new google.maps.places.SearchBox(input1);
    const input2 = document.getElementById("pac-input-2");
    searchBox2 = new google.maps.places.SearchBox(input2);

    mapa.addListener("bounds_changed", () => {
        searchBox1.setBounds(mapa.getBounds());
        searchBox2.setBounds(mapa.getBounds());
    });

    searchBox1.addListener("places_changed", () => {
        handlePlacesChanged(searchBox1, true);
    });

    searchBox2.addListener("places_changed", () => {
        handlePlacesChanged(searchBox2, false);
    });
    document.getElementById('checkbox').addEventListener('change', (event) => {
        if (!event.target.checked) {
            navigator.geolocation.getCurrentPosition(function (position) {
                actualizarUbicacion({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, function () {
                handleLocationError(true, mapa);
            });

        }

    });
    document.getElementById('borrar').addEventListener('click', function () {
        limpiarRutas();
    });

}
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    console.log(name);
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}


function handlePlacesChanged(searchBox, isPrimary) {
    const places = searchBox.getPlaces();

    if (places.length == 0) {
        return;
    }

    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
        if (!place.geometry || !place.geometry.location) {
            console.log("Returned place contains no geometry");
            return;
        }

        if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }

        if (isPrimary) {
            agregarDestino(place.geometry.location);
        } else {
            actualizarUbicacion(place.geometry.location);
        }
    });
    mapa.fitBounds(bounds);
}


function actualizarUbicacion(latLng) {
    if (ubicacion) {
        ubicacion.setPosition(latLng);
    } else {
        ubicacion = new google.maps.Marker({
            position: latLng,
            map: mapa,
            draggable: true,
            title: "Tu ubicacion actual"
        });
    }
    mapa.setCenter(latLng);
}

function limpiarRutas() {
    Object.keys(renderizadores).forEach(function (ruta) {
        renderizadores[ruta].forEach(function (renderizador) {
            renderizador.setMap(null);
        });
        renderizadores[ruta] = [];
    });

    Object.keys(marcadores).forEach(function (ruta) {
        marcadores[ruta].forEach(function (marcador) {
            marcador.setMap(null);
        });
        marcadores[ruta] = [];
    });
}
// Manejo de errores de geolocalización
function handleLocationError(browserHasGeolocation, pos) {
    var infoWindow = new google.maps.InfoWindow({ map: pos });
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

function agregarDestino(latLng) {
    if (destinoMarcador) {
        destinoMarcador.setMap(null);
    }
    destinoMarcador = new google.maps.Marker({
        position: latLng,
        map: mapa,
        title: 'Destino',
        icon: {
            url: 'destino.png',
            scaledSize: new google.maps.Size(30, 30)
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

function findStops(Position, Map, ComparativeDistance) {
    for (let ruta in paraderos) {
        if (paraderos.hasOwnProperty(ruta)) {
            paraderos[ruta].forEach((marcador) => {
                const distance = haversineDistance(Position.lat(), Position.lng(), marcador.parada.lat, marcador.parada.lng);
                if (distance < ComparativeDistance) {
                    addValueToMap(Map, ruta, marcador.id);
                }
            });
        }
    }
}

function IsApproaching(Paraderos, Ubicacion, Destino) {
    console.log(Paraderos);
    let DistanciaMin = Infinity;
    let indiceCercanoDest = -1;
    console.log('Destino');
    Paraderos.forEach((parada, indice) => {
        const distance = haversineDistance(parada.coordenadas.lat, parada.coordenadas.lng, Destino.lat, Destino.lng);
        //console.log(`${parada.coordenadas.lat}, ${parada.coordenadas.lng}: ${distance}`);
        if (distance < DistanciaMin) {
            DistanciaMin = distance;
            indiceCercanoDest = indice;
        }
    });
    DistanciaMin = Infinity;
    let indiceCercanoUbi = -1;
    console.log('Ubicacion');
    Paraderos.forEach((parada, indice) => {
        const distance = haversineDistance(parada.coordenadas.lat, parada.coordenadas.lng, Ubicacion.lat, Ubicacion.lng);
        //console.log(`${parada.coordenadas.lat}, ${parada.coordenadas.lng}: ${distance}`);
        if (distance < DistanciaMin) {
            DistanciaMin = distance;
            indiceCercanoUbi = indice;
        }
    });
    console.log(indiceCercanoUbi);
    console.log(indiceCercanoDest);
    if (indiceCercanoDest === -1 || indiceCercanoUbi === -1) {
        console.log('No encontro indices');
        return false;
    }

    let result = []

    let lastDistance = Infinity;
    if (indiceCercanoUbi < indiceCercanoDest) {
        for (let i = indiceCercanoUbi; i < indiceCercanoDest; i++) {
            const distance = haversineDistance(Paraderos[i].coordenadas.lat, Paraderos[i].coordenadas.lng, Destino.lat, Destino.lng);
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
        console.log('indice ubicacion > indice cercano');
        return false;
    }
    console.log(result);
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
        const distance = haversineDistance(parada.coordenadas.lat, parada.coordenadas.lng, Coordenadas.lat, Coordenadas.lng);
        if (distance < DistanciaMin) {
            DistanciaMin = distance;
            result = { lat: parada.coordenadas.lat, lng: parada.coordenadas.lng };
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

function ManageNearRoutes(CercanasADestino, CercanasAUbicacion, PosicionInicial, PosicionDestino) {
    let increment = 0.1;
    let maxDistance = 0.3;
    let found = false;
    let result = null;

    while (increment <= maxDistance && !found) {
        findStops(PosicionDestino, CercanasADestino, increment);
        findStops(PosicionInicial, CercanasAUbicacion, increment);
        let rutaCercana = containsAny(CercanasAUbicacion, CercanasADestino);

        if (rutaCercana !== null) {
            let rutaKeys = Object.keys(rutaCercana);
            let rutaArray = rutaCercana[rutaKeys[0]];

            if (Array.isArray(rutaKeys)) {
                ChooseRoute(rutaCercana, { lat: PosicionInicial.lat(), lng: PosicionInicial.lng() }, { lat: PosicionDestino.lat(), lng: PosicionDestino.lng() });
            }

            if (Array.isArray(rutaArray) && rutaArray.length > 1) {
                EraseWay(rutaCercana, { lat: PosicionInicial.lat(), lng: PosicionInicial.lng() }, { lat: PosicionDestino.lat(), lng: PosicionDestino.lng() });
            }

            rutaKeys = Object.keys(rutaCercana);
            rutaArray = rutaCercana[rutaKeys[0]];

            const RutaASeguir = GetRoute(rutaKeys[0], rutaArray[0]);
            const { paradas } = RutaASeguir;
            if (IsApproaching(paradas, { lat: PosicionInicial.lat(), lng: PosicionInicial.lng() }, { lat: PosicionDestino.lat(), lng: PosicionDestino.lng() }) === true) {

                result = rutaCercana;
                found = true;
            }
            else {
                increment += 0.1;
            }
        } else {
            increment += 0.1;
        }
    }
    return result;
}

function OneRoute() {
    if (destinoMarcador && ubicacion) {
        let DestinoPos = destinoMarcador.getPosition();
        let InicialPos = ubicacion.getPosition();

        const Inicial = { lat: InicialPos.lat(), lng: InicialPos.lng() };
        const Destino = { lat: DestinoPos.lat(), lng: DestinoPos.lng() };

        let rutasCercanasADestino = new Map();
        let rutasCercanasAUbicacion = new Map();

        findStops(DestinoPos, rutasCercanasADestino, 0.5);
        findStops(InicialPos, rutasCercanasAUbicacion, 0.5);

        let rutaCercana = containsAny(rutasCercanasAUbicacion, rutasCercanasADestino);

        let nombres = [];
        let estaciones = {};
        let solicitudes = [];

        for (let ruta in rutaCercana) {
            if (rutaCercana.hasOwnProperty(ruta)) {
                let recorrido = rutaCercana[ruta];
                if (Array.isArray(recorrido) && recorrido.length > 1) {
                    let DobleRecorrido = {};
                    DobleRecorrido[ruta] = recorrido;
                    EraseWay(DobleRecorrido, Inicial, Destino);
                }
                let solicitud = GetRoute(ruta, recorrido[0]);
                if (IsApproaching(solicitud.paradas, Inicial, Destino)) {
                    nombres.push(ruta);
                } else {
                    delete rutaCercana[ruta];
                }
            }
        }

        for (let ruta in rutaCercana) {
            if (rutaCercana.hasOwnProperty(ruta)) {
                let recorrido = rutaCercana[ruta];
                let solicitud = GetRoute(ruta, recorrido[0]);
                let paradaUbi = GetNearStop(solicitud.paradas, Inicial);
                let paradaDest = GetNearStop(solicitud.paradas, Destino);
                let paradasFiltradas = filterStops(
                    filterStops(solicitud.paradas, paradaUbi, false),
                    paradaDest, true
                );
                estaciones[ruta] = paradasFiltradas;

                let solicitudfiltrada = modificarsolicitud(solicitud.solicitud, paradaUbi, paradaDest);
                solicitudes.push(solicitudfiltrada);
            }
        }

    }
}

function TwoRoutes() {
    if(destinoMarcador && ubicacion)
    {
        let DestinoPos = destinoMarcador.getPosition();
        let InicialPos = ubicacion.getPosition();

        const Inicial = { lat: InicialPos.lat(), lng: InicialPos.lng() };
        const Destino = { lat: DestinoPos.lat(), lng: DestinoPos.lng() };

        let rutasCercanasADestino = new Map();
        let rutasCercanasAUbicacion = new Map();

        findStops(DestinoPos, rutasCercanasADestino, 0.5);
        findStops(InicialPos, rutasCercanasAUbicacion, 0.5);

        console.log(rutasCercanasADestino);
        console.log(rutasCercanasAUbicacion);

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
                                const distanciaEntreParaderos = haversineDistance(paradaU.coordenadas.lat, paradaU.coordenadas.lng, paradaD.coordenadas.lat, paradaD.coordenadas.lng);
                                if ((distanciaEntreParaderos < distanciamascorta) && (IsApproaching(paradasU, { lat: posicionInicial.lat(), lng: posicionInicial.lng() }, { lat: paradaU.coordenadas.lat, lng: paradaU.coordenadas.lng })) && (IsApproaching(paradasD, { lat: paradaD.coordenadas.lat, lng: paradaD.coordenadas.lng }, { lat: posicionDestino.lat(), lng: posicionDestino.lng() }))) {
                                    distanciamascorta = distanciaEntreParaderos;
                                    RutaASeguir1 = objetoUbicacion;
                                    RutaASeguir2 = objetoDestino;
                                    paraderoIntermedio1 = { lat: paradaU.coordenadas.lat, lng: paradaU.coordenadas.lng };
                                    paraderoIntermedio2 = { lat: paradaD.coordenadas.lat, lng: paradaD.coordenadas.lng }
                                }
                            });
                        });
                    }
                }

            });
        });
    }
}

function CalcularRutas() {
    if (destinoMarcador && ubicacion) {
        let posicionDestino = destinoMarcador.getPosition();
        let posicionInicial = ubicacion.getPosition();
        let rutasCercanasADestino = new Map();
        let rutasCercanasAUbicacion = new Map();

        let result = ManageNearRoutes(rutasCercanasADestino, rutasCercanasAUbicacion, posicionInicial, posicionDestino);

        if (rutasCercanasADestino.size !== 0 && rutasCercanasAUbicacion.size !== 0) {
            if (result !== null) {
                console.log(rutasCercanasAUbicacion);
                console.log(rutasCercanasADestino);
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
                    let distanciaUbicacion = haversineDistance(coordenada.coordenadas.lat, coordenada.coordenadas.lng, posicionInicial.lat(), posicionInicial.lng());
                    let distanciaDestino = haversineDistance(coordenada.coordenadas.lat, coordenada.coordenadas.lng, posicionDestino.lat(), posicionDestino.lng());
                    if (distanciaUbicacion < minDistanciaUbicacion) {
                        minDistanciaUbicacion = distanciaUbicacion;
                        paraderoUbicacion = coordenada.coordenadas;
                    }
                    if (distanciaDestino < minDistanciaDestino) {
                        minDistanciaDestino = distanciaDestino;
                        paraderoDestino = coordenada.coordenadas;
                    }
                });
                mostrarRutapersonalizada(RutaASeguir.solicitud, 'green', RutaASeguir.nombre, RutaASeguir.paradas, paraderoUbicacion, paraderoDestino);
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
                                        const distanciaEntreParaderos = haversineDistance(paradaU.coordenadas.lat, paradaU.coordenadas.lng, paradaD.coordenadas.lat, paradaD.coordenadas.lng);
                                        if ((distanciaEntreParaderos < distanciamascorta) && (IsApproaching(paradasU, { lat: posicionInicial.lat(), lng: posicionInicial.lng() }, { lat: paradaU.coordenadas.lat, lng: paradaU.coordenadas.lng })) && (IsApproaching(paradasD, { lat: paradaD.coordenadas.lat, lng: paradaD.coordenadas.lng }, { lat: posicionDestino.lat(), lng: posicionDestino.lng() }))) {
                                            distanciamascorta = distanciaEntreParaderos;
                                            RutaASeguir1 = objetoUbicacion;
                                            RutaASeguir2 = objetoDestino;
                                            paraderoIntermedio1 = { lat: paradaU.coordenadas.lat, lng: paradaU.coordenadas.lng };
                                            paraderoIntermedio2 = { lat: paradaD.coordenadas.lat, lng: paradaD.coordenadas.lng }
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
            let nuevaRutaText = 'No se puede calcular una Ruta desde tu Ubicacion hacia tu Destino';

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

    mostrarRutapersonalizada(Solicitud1.solicitud, 'green', Solicitud1.nombre, Solicitud1.paradas, paraderoinicial, ParaderoIntermedio1);
    mostrarRutapersonalizada(Solicitud2.solicitud, 'blue', Solicitud2.nombre, Solicitud2.paradas, ParaderoIntermedio2, paraderofinal);
}

function mostrarRutapersonalizada(solicitud, color, nombreRuta, Paraderos, paraderoinicio, paraderofinal) {
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
        //suppressMarkers: true
    });
    let nuevasolicitud = modificarsolicitud(solicitud, paraderoinicio, paraderofinal);
    let nuevasparadas = []
    nuevasparadas = filterStops(Paraderos, paraderoinicio, false);
    nuevasparadas = filterStops(nuevasparadas, paraderofinal, true);
    renderizador.setMap(mapa);
    servicioDirecciones.route(nuevasolicitud, function (resultado, estado) {
        if (estado === 'OK') {
            renderizador.setDirections(resultado);

            nuevasparadas.forEach(function (parada) {
                marcadores[nombreRuta].push(createMarker({ lat: parada.coordenadas.lat, lng: parada.coordenadas.lng }, color));
            });
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

function filterStops(Paradas, Coordenada, Posteriores) {
    let indiceParada = -1;

    Paradas.forEach((st, indice) => {
        if (st.coordenadas.lat === Coordenada.lat && st.coordenadas.lng === Coordenada.lng) {
            indiceParada = indice;
        }
    })

    if (indiceParada !== -1) {
        let paradasfiltradas;
        if (Posteriores) {
            paradasfiltradas = Paradas.slice(0, indiceParada + 1);
        }
        else {
            paradasfiltradas = Paradas.slice(indiceParada);
        }
        return paradasfiltradas;
    }
    else {
        console.log('No se encontro la parada');
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
        } else {
            window.alert('Error al obtener la ruta de inicio: ' + estado);
        }
    });
    renderizadores[nombreRuta].push(renderizadorInicio);

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
            rutaAmostrar = 'COTUM A';
            break;
        case 'Ruta2':
            rutaAmostrar = 'Dolores San Martin';
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
            rutaAmostrar = 'C7-5 AQP Masivo Alto Libertad ';
            break;
        case 'Ruta8':
            rutaAmostrar = 'C11 COTUM B';
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
        let ultimoElemento = rutaNombreContainer.lastElementChild;
        ultimoElemento.textContent += ' luego ' + nuevaRutaText;
    } else {
        rutaNombreElement.textContent = nuevaRutaText;
        rutaNombreContainer.appendChild(rutaNombreElement);
    }
}


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
    rutaNombreContainer.innerHTML = '';
}


function cargarParaderos(paradasAutobus, ruta, recorrido) {
    if (!paraderos[ruta]) {
        paraderos[ruta] = [];
    }

    paradasAutobus.forEach(function (parada) {
        var marcador = {
            id: recorrido,
            parada: parada.coordenadas
        }
        paraderos[ruta].push(marcador);
    });
}

function cambiarColorSVG(svgString, color) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgString.trim();

    const pathElements = tempDiv.querySelectorAll('path');

    pathElements.forEach(pathElement => {
        const originalFill = pathElement.getAttribute('fill');
        const originalStroke = pathElement.getAttribute('stroke');

        if (originalFill === '#FFFFFF' || !originalFill) {
            pathElement.setAttribute('fill', color);
        }

        if (originalStroke === '#FFFFFF' || !originalStroke) {
            pathElement.setAttribute('stroke', color);
        }
    });

    const svgData = new XMLSerializer().serializeToString(tempDiv.firstChild);
    const svgEncoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

    return svgEncoded;
}


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
                { location: { lat: -16.389253, lng: -71.574946 }, stopover: true },
                { location: { lat: -16.397709, lng: -71.575106 }, stopover: true },
                { location: { lat: -16.402060, lng: -71.573212 }, stopover: true },
                { location: { lat: -16.403633, lng: -71.568295 }, stopover: true },
                { location: { lat: -16.399951, lng: -71.570568 }, stopover: true },
                { location: { lat: -16.393313, lng: -71.568170 }, stopover: true },
                { location: { lat: -16.390809, lng: -71.567340 }, stopover: true },
                { location: { lat: -16.392139, lng: -71.566163 }, stopover: true },
                { location: { lat: -16.392765, lng: -71.560332 }, stopover: true },
                { location: { lat: -16.392901, lng: -71.557394 }, stopover: true },
                { location: { lat: -16.388084, lng: -71.552075 }, stopover: true },
                { location: { lat: -16.389092, lng: -71.549322 }, stopover: true },
                { location: { lat: -16.390133, lng: -71.546492 }, stopover: true },
                { location: { lat: -16.392224, lng: -71.540735 }, stopover: true },
                { location: { lat: -16.392997, lng: -71.536654 }, stopover: true },
                { location: { lat: -16.393347, lng: -71.535545 }, stopover: true },
                { location: { lat: -16.391799, lng: -71.530726 }, stopover: true },
                { location: { lat: -16.394241, lng: -71.530847 }, stopover: true },
                { location: { lat: -16.395505, lng: -71.527379 }, stopover: true },
                { location: { lat: -16.399560, lng: -71.521542 }, stopover: true },
                { location: { lat: -16.402910, lng: -71.516657 }, stopover: true },
                { location: { lat: -16.415599, lng: -71.515250 }, stopover: true },
                { location: { lat: -16.425661, lng: -71.515024 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.389402, lng: -71.574932 }, nombre: 'Reservorio semirural Pacahcutec' },
            { coordenadas: { lat: -16.397699, lng: -71.575094 }, nombre: 'Grifo COPAR' },
            { coordenadas: { lat: -16.399962, lng: -71.570597 }, nombre: 'Coliseo Gallos la calle' },
            { coordenadas: { lat: -16.393322, lng: -71.568207 }, nombre: 'Coleigo Divino Niño Jesus' },
            { coordenadas: { lat: -16.392772, lng: -71.560269 }, nombre: 'Agente Caja Arequipa' },
            { coordenadas: { lat: -16.392710, lng: -71.556940 }, nombre: 'Promart' },
            { coordenadas: { lat: -16.388102, lng: -71.552045 }, nombre: 'Est ejercito-Honda Conauto' },
            { coordenadas: { lat: -16.389097, lng: -71.549339 }, nombre: 'Real Plaza' },
            { coordenadas: { lat: -16.390184, lng: -71.546413 }, nombre: 'Mall Plaza Cayma' },
            { coordenadas: { lat: -16.392248, lng: -71.540735 }, nombre: 'Estacion recoleta' },
            { coordenadas: { lat: -16.393023, lng: -71.536599 }, nombre: 'Estacion Grau' },
            { coordenadas: { lat: -16.393349, lng: -71.535529 }, nombre: 'san lazaro' },
            { coordenadas: { lat: -16.391902, lng: -71.5324266 }, nombre: 'Parque selva alegre' },
            { coordenadas: { lat: -16.394210, lng: -71.530851 }, nombre: 'seguro social' },
            { coordenadas: { lat: -16.399398, lng: -71.521790 }, nombre: 'El Tablon' },
            { coordenadas: { lat: -16.402912, lng: -71.516663 }, nombre: 'Ovalo mariscal Castilla' },
            { coordenadas: { lat: -16.415587, lng: -71.515251 }, nombre: 'Tottus -pororngoche-Mall aventura Plaza' },
            { coordenadas: { lat: -16.425626, lng: -71.514997 }, nombre: 'Reservorio guardia civil' },
            { coordenadas: { lat: -16.430518, lng: -71.532659 }, nombre: 'Ovalo la Pacheta' },
            { coordenadas: { lat: -16.4290323, lng: -71.5239811 }, nombre: 'GRifo Primax monterrey' }
            
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
                { location: { lat: -16.407785, lng: -71.538436 }, stopover: true },
                { location: { lat: -16.405772, lng: -71.540024 }, stopover: true },
                { location: { lat: -16.399908, lng: -71.542117 }, stopover: true },
                { location: { lat: -16.396656, lng: -71.54519 }, stopover: true },
                { location: { lat: -16.395860, lng: -71.546859 }, stopover: true },
                { location: { lat: -16.395264, lng: -71.54820 }, stopover: true },
                { location: { lat: -16.393445, lng: -71.54907 }, stopover: true },
                { location: { lat: -16.389840, lng: -71.547613 }, stopover: true },
                { location: { lat: -16.389005, lng: -71.549278 }, stopover: true },
                { location: { lat: -16.388102, lng: -71.552045 }, stopover: true },
                { location: { lat: -16.392710, lng: -71.55694 }, stopover: true },
                { location: { lat: -16.392772, lng: -71.560269 }, stopover: true },
                { location: { lat: -16.393322, lng: -71.568207 }, stopover: true },
                { location: { lat: -16.399962, lng: -71.570597 }, stopover: true },
                { location: { lat: -16.403169, lng: -71.568374 }, stopover: true },
                { location: { lat: -16.404401, lng: -71.572777 }, stopover: true },
                { location: { lat: -16.397699, lng: -71.57509 }, stopover: true },
                { location: { lat: -16.389244, lng: -71.574942 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.427124, lng: -71.532956 }, nombre: 'Banco de la nacion' },
            { coordenadas: { lat: -16.424925, lng: -71.533091 }, nombre: 'Ovalo avelino-Interbank' },
            { coordenadas: { lat: -16.415159, lng: -71.534055 }, nombre: 'Hospital Regional Honorio Delgado Espinoza III-1' },
            { coordenadas: { lat: -16.412611, lng: -71.53509 }, nombre: 'unsa biomedicas' },
            { coordenadas: { lat: -16.407767, lng: -71.538579 }, nombre: 'estacion ormeño' },
            { coordenadas: { lat: -16.405729, lng: -71.540011 }, nombre: 'estacion salaverry y la merced-instituto del sur' },
            { coordenadas: { lat: -16.399908, lng: -71.542117 }, nombre: 'av la marina-plaza vea' },
            { coordenadas: { lat: -16.396656, lng: -71.545194 }, nombre: 'hospital yanahuara' },
            { coordenadas: { lat: -16.395264, lng: -71.548209 }, nombre: 'parque del avion' },
            { coordenadas: { lat: -16.393445, lng: -71.549074 }, nombre: 'Marco aldany' },
            { coordenadas: { lat: -16.389840, lng: -71.547613 }, nombre: 'inkafarma-trinidad moral' },
            { coordenadas: { lat: -16.389097, lng: -71.549339 }, nombre: 'Real Plaza' },
            { coordenadas: { lat: -16.388102, lng: -71.552045 }, nombre: 'Est ejercito-Honda Conauto' },
            { coordenadas: { lat: -16.392710, lng: -71.556940 }, nombre: 'Promart' },
            { coordenadas: { lat: -16.392772, lng: -71.560269 }, nombre: 'Agente Caja Arequipa' },
            { coordenadas: { lat: -16.393322, lng: -71.568207 }, nombre: 'Coleigo Divino Niño Jesus' },
            { coordenadas: { lat: -16.399962, lng: -71.570597 }, nombre: 'Coliseo Gallos la calle' },
            { coordenadas: { lat: -16.397699, lng: -71.575094 }, nombre: 'Grifo COPAR' },
            { coordenadas: { lat: -16.389402, lng: -71.574932 }, nombre: 'Reservorio semirural Pacahcutec' }            
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta1'
    },

    Ruta2_Ida: {
        solicitud: {
            origin: { lat: -16.456477, lng: -71.521933 },
            destination: { lat: -16.40174901915841, lng: -71.5284574981898 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.457903, lng: -71.523766 }, stopover: true },
                { location: { lat: -16.460708, lng: -71.525649 }, stopover: true },
                { location: { lat: -16.452572, lng: -71.531009 }, stopover: true },
                { location: { lat: -16.450223, lng: -71.532555 }, stopover: true },
                { location: { lat: -16.442026, lng: -71.528828 }, stopover: true },
                { location: { lat: -16.440874, lng: -71.525622 }, stopover: true },
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
                { location: { lat: -16.405536, lng: -71.528936 }, stopover: true },
                { location: { lat: -16.40437, lng: -71.53169 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.456477, lng: -71.521933 }, nombre: 'Urb la Palizada' },
            { coordenadas: { lat: -16.457903, lng: -71.523766 }, nombre: 'Parque Mickey II' },
            { coordenadas: { lat: -16.460708, lng: -71.525649 }, nombre: 'Parque Colibrí de La Campiña' },
            { coordenadas: { lat: -16.452572, lng: -71.531009 }, nombre: 'Grifo Milagritos-Socabaya' },
            { coordenadas: { lat: -16.450223, lng: -71.532555 }, nombre: 'Parque Lara' },
            { coordenadas: { lat: -16.442026, lng: -71.528828 }, nombre: 'Grifo San Fernando REPSOL' },
            { coordenadas: { lat: -16.440884, lng: -71.525574 }, nombre: 'Grifo Tasahuayo' },
            { coordenadas: { lat: -16.439259, lng: -71.521772 }, nombre: 'Posta' },
            { coordenadas: { lat: -16.436103, lng: -71.521443 }, nombre: 'Baños Sauna Pacific' },
            { coordenadas: { lat: -16.432944, lng: -71.522624 }, nombre: 'Farmacia Santa Fe' },
            { coordenadas: { lat: -16.429245, lng: -71.523600 }, nombre: 'Grifo Primax Monterrey' },
            { coordenadas: { lat: -16.427194, lng: -71.518024 }, nombre: 'Parque los Ccoritos' },
            { coordenadas: { lat: -16.425749, lng: -71.514817 }, nombre: 'Reservorio' },
            { coordenadas: { lat: -16.419447, lng: -71.516917 }, nombre: 'Viky Salón Y Peluqueria' },
            { coordenadas: { lat: -16.417841, lng: -71.517824 }, nombre: 'Pasaje para el mall' },
            { coordenadas: { lat: -16.411135, lng: -71.521609 }, nombre: 'Parque Lambramani' },
            { coordenadas: { lat: -16.407074, lng: -71.524615 }, nombre: 'Av Venezuela' },
            { coordenadas: { lat: -16.404404, lng: -71.527439 }, nombre: 'Paucarpata con Indepenencia' },
            { coordenadas: { lat: -16.405536, lng: -71.528936 }, nombre: 'Coliseo' },
            { coordenadas: { lat: -16.404377, lng: -71.53168 }, nombre: 'Terminal' }
            
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
                { location: { lat: -16.440927, lng: -71.522868 }, stopover: true },
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
            { coordenadas: { lat: -16.401749, lng: -71.528457 }, nombre: 'HOSPITAL GOYONECHE' },
            { coordenadas: { lat: -16.401954, lng: -71.524461 }, nombre: 'Parque de la UNSA' },
            { coordenadas: { lat: -16.399534, lng: -71.521622 }, nombre: 'Tablon' },
            { coordenadas: { lat: -16.402977, lng: -71.516561 }, nombre: 'Ovalo de Mariscal Castilla' },
            { coordenadas: { lat: -16.409027, lng: -71.514022 }, nombre: 'Maderera San Antonio' },
            { coordenadas: { lat: -16.416183, lng: -71.515461 }, nombre: 'Tottus' },
            { coordenadas: { lat: -16.422539, lng: -71.516351 }, nombre: 'Colegio neptali' },
            { coordenadas: { lat: -16.425661, lng: -71.514982 }, nombre: 'Reservorio' },
            { coordenadas: { lat: -16.429077, lng: -71.523814 }, nombre: 'Grifo Primax Monterrey' },
            { coordenadas: { lat: -16.436226, lng: -71.521600 }, nombre: 'Cevicheria' },
            { coordenadas: { lat: -16.437491, lng: -71.523837 }, nombre: 'Piscina Bustamante' },
            { coordenadas: { lat: -16.439144, lng: -71.522477 }, nombre: 'Urb. Amauta' },
            { coordenadas: { lat: -16.440673, lng: -71.525134 }, nombre: 'Campo Deportivo de Tasahuayo' },
            { coordenadas: { lat: -16.441976, lng: -71.529016 }, nombre: 'El Árabe' },
            { coordenadas: { lat: -16.448469, lng: -71.532918 }, nombre: 'Chicken Brass polleria' },
            { coordenadas: { lat: -16.452495, lng: -71.531095 }, nombre: 'Grifo' },
            { coordenadas: { lat: -16.461431, lng: -71.526400 }, nombre: 'Lara Tradicional' },
            { coordenadas: { lat: -16.458100, lng: -71.523867 }, nombre: 'Parque Mickey I' },
            { coordenadas: { lat: -16.457587, lng: -71.522714 }, nombre: 'la Palizada' },
            { coordenadas: { lat: -16.456909, lng: -71.521806 }, nombre: 'Terminal' }            
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
                { location: { lat: -16.395454, lng: -71.523968 }, stopover: true },
                { location: { lat: -16.3982240, lng: -71.5266890 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.3768449, lng: -71.4989620 }, nombre: 'Terminal Mariategui' },
            { coordenadas: { lat: -16.3755234, lng: -71.4997373 }, nombre: 'I.E. padre Eloy' },
            { coordenadas: { lat: -16.3736312, lng: -71.5012127 }, nombre: 'Torre de control' },
            { coordenadas: { lat: -16.373694, lng: -71.502135 }, nombre: 'Estadio porvenir' },
            { coordenadas: { lat: -16.373035, lng: -71.502874 }, nombre: 'Grifo porvenir' },
            { coordenadas: { lat: -16.374229, lng: -71.504492 }, nombre: 'Plaza Porvenir' },
            { coordenadas: { lat: -16.375801, lng: -71.506863 }, nombre: 'Colegio Amauta' },
            { coordenadas: { lat: -16.3770044, lng: -71.5086281 }, nombre: 'Comisaria Porvenir' },
            { coordenadas: { lat: -16.3799546, lng: -71.5095353 }, nombre: 'Cristo obrero' },
            { coordenadas: { lat: -16.3827078, lng: -71.511775 }, nombre: 'Posta AltoMisti' },
            { coordenadas: { lat: -16.386294, lng: -71.514814 }, nombre: 'Colegio Luna Pizarro' },
            { coordenadas: { lat: -16.38792, lng: -71.516201 }, nombre: 'Comisaria Alto Misti' },
            { coordenadas: { lat: -16.3908519, lng: -71.5186827 }, nombre: 'Iglesia Chapi chico' },
            { coordenadas: { lat: -16.39313, lng: -71.520604 }, nombre: 'I.E. Jose Galvez' },
            { coordenadas: { lat: -16.394169, lng: -71.521464 }, nombre: 'Parque mayta capac' },
            { coordenadas: { lat: -16.393553, lng: -71.522717 }, nombre: 'San martin' },
            { coordenadas: { lat: -16.395475, lng: -71.523999 }, nombre: 'Calle Puno' },
            { coordenadas: { lat: -16.395454, lng: -71.523968 }, nombre: 'Muñoz najar' },
            { coordenadas: { lat: -16.398224, lng: -71.526689 }, nombre: 'Canal 2' },
            { coordenadas: { lat: -16.399557, lng: -71.528701 }, nombre: 'La paz' }
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
                { location: { lat: -16.380258, lng: -71.509484 }, stopover: true },
                { location: { lat: -16.3773510, lng: -71.5085050 }, stopover: true },
                { location: { lat: -16.3758440, lng: -71.5065960 }, stopover: true },
                { location: { lat: -16.3731280, lng: -71.5027630 }, stopover: true },
                { location: { lat: -16.3738518, lng: -71.5020764 }, stopover: true },
                { location: { lat: -16.3737020, lng: -71.5012340 }, stopover: true },
                { location: { lat: -16.3754210, lng: -71.4997430 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.399557, lng: -71.528701 }, nombre: 'La paz' },
            { coordenadas: { lat: -16.400929, lng: -71.527684 }, nombre: 'Pasaje Santa rosa' },
            { coordenadas: { lat: -16.400071, lng: -71.526317 }, nombre: 'La salle' },
            { coordenadas: { lat: -16.3981197, lng: -71.5239162 }, nombre: 'Av. Mariscal Castilla' },
            { coordenadas: { lat: -16.396735, lng: -71.522184 }, nombre: 'Calle Puno' },
            { coordenadas: { lat: -16.395308, lng: -71.520406 }, nombre: 'Av. Progreso' },
            { coordenadas: { lat: -16.394322, lng: -71.52134 }, nombre: 'Parque mayta capac' },
            { coordenadas: { lat: -16.393351, lng: -71.520546 }, nombre: 'I.E. Jose Galvez' },
            { coordenadas: { lat: -16.3909577, lng: -71.5185623 }, nombre: 'Iglesia Chapi chico' },
            { coordenadas: { lat: -16.388128, lng: -71.516168 }, nombre: 'Comisaria AltoMisti' },
            { coordenadas: { lat: -16.386534, lng: -71.514784 }, nombre: 'Colegio Luna Pizarro' },
            { coordenadas: { lat: -16.382813, lng: -71.511625 }, nombre: 'Posta AltoMisti' },
            { coordenadas: { lat: -16.380258, lng: -71.509484 }, nombre: 'Cristo obrero' },
            { coordenadas: { lat: -16.377351, lng: -71.508505 }, nombre: 'Comisaria Porvenir' },
            { coordenadas: { lat: -16.375844, lng: -71.506596 }, nombre: 'Colegio Amauta' },
            { coordenadas: { lat: -16.373128, lng: -71.502763 }, nombre: 'Grifo porvenir' },
            { coordenadas: { lat: -16.3738517, lng: -71.5020763 }, nombre: 'Estadio porvenir' },
            { coordenadas: { lat: -16.373702, lng: -71.501234 }, nombre: 'Torre de control' },
            { coordenadas: { lat: -16.375421, lng: -71.499743 }, nombre: 'I.E. padre Eloy' },
            { coordenadas: { lat: -16.376806, lng: -71.498764 }, nombre: 'Terminal Mariategui' }            

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
                { location: { lat: -16.394737, lng: -71.537856 }, stopover: true },
                { location: { lat: -16.399358, lng: -71.540063 }, stopover: true },
                { location: { lat: -16.402460, lng: -71.538958 }, stopover: true },
                { location: { lat: -16.405606, lng: -71.539917 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.365748, lng: -71.501906 }, nombre: 'Terminal' },
            { coordenadas: { lat: -16.367482, lng: -71.500636 }, nombre: 'Espiritu Santo II' },
            { coordenadas: { lat: -16.368205, lng: -71.503650 }, nombre: 'Polleria Don Daniel' },
            { coordenadas: { lat: -16.368357, lng: -71.507288 }, nombre: 'Parque Tripartido' },
            { coordenadas: { lat: -16.368915, lng: -71.509578 }, nombre: 'Complejo Deportivo' },
            { coordenadas: { lat: -16.370732, lng: -71.511512 }, nombre: 'Av los claveles' },
            { coordenadas: { lat: -16.371820, lng: -71.512910 }, nombre: 'La Canchita' },
            { coordenadas: { lat: -16.373352, lng: -71.511797 }, nombre: 'Fotos San José' },
            { coordenadas: { lat: -16.374917, lng: -71.513921 }, nombre: 'Av Obrera' },
            { coordenadas: { lat: -16.377403, lng: -71.517193 }, nombre: 'Polleria Aurora' },
            { coordenadas: { lat: -16.378842, lng: -71.516258 }, nombre: 'I.E. Diego de San Pedro' },
            { coordenadas: { lat: -16.382180, lng: -71.517205 }, nombre: 'Como en casa' },
            { coordenadas: { lat: -16.391750, lng: -71.533061 }, nombre: ' América' },
            { coordenadas: { lat: -16.393594, lng: -71.537316 }, nombre: 'Hotel San Lázaro' },
            { coordenadas: { lat: -16.393594, lng: -71.537316 }, nombre: 'Puente Grau' },
            { coordenadas: { lat: -16.394764, lng: -71.537791 }, nombre: 'Villalba San José Oriol' },
            { coordenadas: { lat: -16.399281, lng: -71.539981 }, nombre: 'Cruz Verde' },
            { coordenadas: { lat: -16.402460, lng: -71.538958 }, nombre: 'Calle Merced' },
            { coordenadas: { lat: -16.405708, lng: -71.540099 }, nombre: 'Salaverry' },
            { coordenadas: { lat: -16.408392, lng: -71.542020 }, nombre: 'Parque Mariano Melgar' }            
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
                { location: { lat: -16.366978, lng: -71.499631 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.408392, lng: -71.542020 }, nombre: 'Parque Mariano Melgar' },
            { coordenadas: { lat: -16.407175, lng: -71.538575 }, nombre: 'Carsa' },
            { coordenadas: { lat: -16.403214, lng: -71.536795 }, nombre: 'Chifa Broastería' },
            { coordenadas: { lat: -16.401360, lng: -71.536073 }, nombre: 'Hostal El Roble' },
            { coordenadas: { lat: -16.392164, lng: -71.532378 }, nombre: 'Academia Mendel' },
            { coordenadas: { lat: -16.388937, lng: -71.526260 }, nombre: '1 de Mayo' },
            { coordenadas: { lat: -16.385680, lng: -71.524602 }, nombre: 'Ca. Alianza' },
            { coordenadas: { lat: -16.386409, lng: -71.522936 }, nombre: 'Paradero' },
            { coordenadas: { lat: -16.382180, lng: -71.517205 }, nombre: 'Como en casa' },
            { coordenadas: { lat: -16.378814, lng: -71.516096 }, nombre: 'Intersección Av Brazil y Av. México' },
            { coordenadas: { lat: -16.377581, lng: -71.515363 }, nombre: 'Intersección Av. Huascar y Av. Uruguay' },
            { coordenadas: { lat: -16.374917, lng: -71.513921 }, nombre: 'Car Wash Davico' },
            { coordenadas: { lat: -16.373352, lng: -71.511797 }, nombre: 'San José' },
            { coordenadas: { lat: -16.370732, lng: -71.511512 }, nombre: 'Intersección Av cusco y Av los claveles' },
            { coordenadas: { lat: -16.368836, lng: -71.508194 }, nombre: 'Tienda Power - Villa Unión' },
            { coordenadas: { lat: -16.368225, lng: -71.503925 }, nombre: 'Polleria Don Daniel' },
            { coordenadas: { lat: -16.369784, lng: -71.503754 }, nombre: 'Av Circunvalación' },
            { coordenadas: { lat: -16.369636, lng: -71.502064 }, nombre: 'San Luis C' },
            { coordenadas: { lat: -16.366831, lng: -71.499585 }, nombre: 'Huayro Restaurante' },
            { coordenadas: { lat: -16.365748, lng: -71.501906 }, nombre: 'ESPIRITU SANTO' }            

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
                { coordenadas: { lat: -16.378560, lng: -71.493560 }, nombre: 'La Galaxia Mz N LT 6, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.378510, lng: -71.496630 }, nombre: 'JGC3+H5W, Arequipa 04004, Peru' }, 
                { coordenadas: { lat: -16.382060, lng: -71.500450 }, nombre: ' Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.381270, lng: -71.505370 }, nombre: 'F,C, JF9V+GVR, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.380960, lng: -71.508440 }, nombre: 'Carlos GArcia Bloque P - Dep, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.380180, lng: -71.509590 }, nombre: 'Tacna Y Arica 245, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.391050, lng: -71.518790 }, nombre: 'Av. Pro Hogar 1001, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.394250, lng: -71.521530 }, nombre: 'JF4H+895, Av. Progreso, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.394360, lng: -71.521460 }, nombre: 'Av. Progreso 700, Miraflores 04001, Peru' }, 
                { coordenadas: { lat: -16.396470, lng: -71.518750 }, nombre: 'Av. Progreso 982, Miraflores 04001, Peru' }, 
                { coordenadas: { lat: -16.399500, lng: -71.516820 }, nombre: 'Sepúlveda 406, Miraflores 04001, Peru' }, 
                { coordenadas: { lat: -16.414260, lng: -71.543610 }, nombre: 'Angel Caballero 2700, Arequipa 04001, Peru' }, 
                { coordenadas: { lat: -16.420170, lng: -71.538210 }, nombre: 'Av. los Incas 34, Arequipa 04001, Peru' }, 
                { coordenadas: { lat: -16.423100, lng: -71.541820 }, nombre: 'C-11, Hunter, Av. Andrés Avelino Cáceres, José Luis Bustamante y Rivero 04011, Peru' }, 
                { coordenadas: { lat: -16.380180, lng: -71.509590 }, nombre: 'Tacna Y Arica 245, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.391050, lng: -71.518790 }, nombre: 'Av. Pro Hogar 1001, Miraflores 04004, Peru' }, 
                { coordenadas: { lat: -16.394360, lng: -71.521460 }, nombre: 'Av. Progreso 700, Miraflores 04001, Peru' }, 
                { coordenadas: { lat: -16.399500, lng: -71.516820 }, nombre: 'Sepúlveda 406, Miraflores 04001, Peru' }, 
                { coordenadas: { lat: -16.420170, lng: -71.538210 }, nombre: 'Av. los Incas 34, Arequipa 04001, Peru' }, 
                { coordenadas: { lat: -16.423100, lng: -71.541820 }, nombre: 'C-11, Hunter, Av. Andrés Avelino Cáceres, José Luis Bustamante y Rivero 04011, Peru' }, 
                { coordenadas: { lat: -16.399500, lng: -71.516820 }, nombre: 'Sepúlveda 406, Miraflores 04001, Peru' }, 
                { coordenadas: { lat: -16.394360, lng: -71.521460 }, nombre: 'Av. Progreso 700, Miraflores 04001, Peru' }, 
                { coordenadas: { lat: -16.423100, lng: -71.541820 }, nombre: 'C-11, Hunter, Av. Andrés Avelino Cáceres, José Luis Bustamante y Rivero 04011, Peru' }  
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
            { coordenadas: { lat: -16.425649, lng: -71.534593 }, nombre: 'Av. Andrés Avelino Cáceres' }, 
            { coordenadas: { lat: -16.426290, lng: -71.533841 }, nombre: 'Av. Cementerio 13' },  
            { coordenadas: { lat: -16.426849, lng: -71.533021 }, nombre: 'Lanificio' },
            { coordenadas: { lat: -16.417179, lng: -71.532656 }, nombre: 'Funerario Franco' },  
            { coordenadas: { lat: -16.412443, lng: -71.535086 }, nombre: 'UNSA BIOMEDICAS' },
            { coordenadas: { lat: -16.399699, lng: -71.515342 }, nombre: 'Calle Teniente Ferre' },
            { coordenadas: { lat: -16.399409, lng: -71.516563 }, nombre: 'P.t Miraflores Parcela a' },
            { coordenadas: { lat: -16.398443, lng: -71.515917 }, nombre: 'Colegio Del Ejército Arequipa' },
            { coordenadas: { lat: -16.394424,  lng: -71.521229 }, nombre: 'Pro - Hogar' },
            { coordenadas: { lat: -16.380959,  lng: -71.508514 }, nombre: 'Tacna Y Arica 300-320' },
            { coordenadas: { lat: -16.381153, lng: -71.505459 }, nombre: 'P.j Tahuantinsuyo Zona a' },
            { coordenadas: { lat: -16.382087, lng:-71.500624 }, nombre: 'P.j Tahuantinsuyo Zona a' },
            { coordenadas: { lat: -16.378752, lng:-71.497561 }, nombre: 'Alto Juan XXIII' },
            { coordenadas: { lat: -16.378392, lng:-71.496308 }, nombre: 'La Galaxia' },
            { coordenadas: { lat: -16.378346, lng:-71.493489 }, nombre: 'Tienda de abarrotes "Diana Sandra"' }
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
                { location: { lat: -16.413523, lng: -71.539138 }, stopover: true },
                { location: { lat: -16.41409, lng: -71.54284 }, stopover: true },
                { location: { lat: -16.42055, lng: -71.53899 }, stopover: true },
                { location: { lat: -16.42220, lng: -71.54407 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.37856, lng: -71.49356 }, nombre: 'La Galaxia, Miraflores 04004, Peru' },
            { coordenadas: { lat: -16.37933, lng: -71.49863 }, nombre: 'Miraflores 04004, Peru' },
            { coordenadas: { lat: -16.38132, lng: -71.50234 }, nombre: '2do paradero Miraflores 04004, Peru' },
            { coordenadas: { lat: -16.38069, lng: -71.50884 }, nombre: 'Tacna Y Arica 314, Miraflores' },
            { coordenadas: { lat: -16.38281, lng: -71.51182 }, nombre: ' Av. Tarapacá 1603, Miraflores' },
            { coordenadas: { lat: -16.38742, lng: -71.51573 }, nombre: 'Av. Tarapacá 627, Miraflores' },
            { coordenadas: { lat: -16.39105, lng: -71.51879 }, nombre: 'Av. Pro Hogar 1001, Miraflores' },
            { coordenadas: { lat: -16.39419, lng: -71.52147 }, nombre: 'Av. Pro Hogar 407, Miraflores' },
            { coordenadas: { lat: -16.39785, lng: -71.51678 }, nombre: 'Av. Progreso 1192, Miraflores' },
            { coordenadas: { lat: -16.40022, lng: -71.51601 }, nombre: 'Av. Teniente Ferre 217, Miraflores' },
            { coordenadas: { lat: -16.40533, lng: -71.52153 }, nombre: 'Vía Rápida Venezuela 332,' },
            { coordenadas: { lat: -16.40642, lng: -71.52317 }, nombre: 'HFVG+JQ2, Arequipa 04001, Peru' },
            { coordenadas: { lat: -16.40812, lng: -71.52674 }, nombre: 'Vía Rápida Venezuela 1016, Cercado De Arequipa' },
            { coordenadas: { lat: -16.41276, lng: -71.53690 }, nombre: 'Percy.Gibson 102, Arequipa ' },
            { coordenadas: { lat: -16.413523, lng: -71.539138 }, nombre: 'Vía Rápida Venezuela 2207, Arequipa' },
            { coordenadas: { lat: -16.41409, lng: -71.54284 }, nombre: ' Vía Rápida Venezuela 140, Arequipa' },
            { coordenadas: { lat: -16.42055, lng: -71.53899 }, nombre: 'HFH6+R87, Arequipa 04001, Peru' },
            { coordenadas: { lat: -16.42220, lng: -71.54407 }, nombre: 'Av. los Incas 2614, Arequipa 04001' }
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
            { coordenadas: { lat: -16.42674, lng: -71.53389 }, nombre: 'C. Republica de Chile 103, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.42573, lng: -71.53304 }, nombre: 'Av. Perú 3, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.41675, lng: -71.53293 }, nombre: 'Av. Daniel Alcides Carrión 513, Arequipa' },
            { coordenadas: { lat: -16.41603, lng: -71.53355 }, nombre: 'Matto 94, Arequipa' },
            { coordenadas: { lat: -16.41366, lng: -71.53475 }, nombre: 'Av. Daniel Alcides Carrión 501-A, Arequipa' },
            { coordenadas: { lat: -16.41049, lng: -71.53266 }, nombre: 'HFQ9+R27, Arequipa 04001' },
            { coordenadas: { lat: -16.40822, lng: -71.52663 }, nombre: 'Vía Rápida Venezuela 938, Cercado de Arequipa' },
            { coordenadas: { lat: -16.40628, lng: -71.52281 }, nombre: 'Av. Virgen del Pilar, Arequipa' },
            { coordenadas: { lat: -16.40534, lng: -71.52129 }, nombre: 'Vía Rápida Venezuela 330, Arequipa' },
            { coordenadas: { lat: -16.40293, lng: -71.51794 }, nombre: 'Av. Republica de Venezuela 141, Arequipa' },
            { coordenadas: { lat: -16.40124, lng: -71.51660 }, nombre: 'Elias Aguirre 5, Miraflores ' },
            { coordenadas: { lat: -16.39838, lng: -71.51593 }, nombre: 'Palacios, Miraflores' },
            { coordenadas: { lat: -16.39431, lng: -71.52134 }, nombre: 'Pro-Hogar, Av. Pro Hogar, Arequipa' },
            { coordenadas: { lat: -16.39058, lng: -71.51828 }, nombre: 'Ca. Ramon Castilla 503, Miraflores' },
            { coordenadas: { lat: -16.38286, lng: -71.51177 }, nombre: 'Av. Tarapacá 1603, Miraflores' },
            { coordenadas: { lat: -16.38069, lng: -71.50884 }, nombre: 'Tacna Y Arica 314, Miraflores' },
            { coordenadas: { lat: -16.38141, lng: -71.50217 }, nombre: ' Miraflores 04004, Peru' },
            { coordenadas: { lat: -16.37933, lng: -71.49863 }, nombre: ' 2do paradero Miraflores 04004, Peru' },
            { coordenadas: { lat: -16.37856, lng: -71.49356 }, nombre: 'La Galaxia Mz N LT 6, Miraflores' }
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
            { coordenadas: { lat: -16.384800, lng: -71.570220 }, nombre: 'Av. Perú 405, Cerro Colorado' },
            { coordenadas: { lat: -16.380579, lng: -71.568915 }, nombre: 'Mariano Melgar 500, Cerro Colorado' },
            { coordenadas: { lat: -16.375233, lng: -71.567978 }, nombre: 'Av. Puno 1102, Cerro Colorado ' },
            { coordenadas: { lat: -16.375036, lng: -71.566817 }, nombre: '27 de Noviembre 202, Cerro Colorado ' },
            { coordenadas: { lat: -16.374349, lng: -71.561483 }, nombre: 'Mariano Melgar 625, Arequipa' },
            { coordenadas: { lat: -16.379168, lng: -71.559184 }, nombre: 'Jorge Chavez 146-760, Cerro Colorado' },
            { coordenadas: { lat: -16.381021, lng: -71.556761 }, nombre: 'Av. Pumacahua 100, Arequipa' },
            { coordenadas: { lat: -16.384138, lng: -71.555935 }, nombre: ' Av. Chachani 110-A, Cerro Colorado' },
            { coordenadas: { lat: -16.389280, lng: -71.548936 }, nombre: ' Av. Ejército 1005, Cayma ' },
            { coordenadas: { lat: -16.391946, lng: -71.548793 }, nombre: 'Av. Trinidad Moran H-22 León XIII Cayma Cercado de Arequipa, Cayma' },
            { coordenadas: { lat: -16.397905, lng: -71.545947 }, nombre: 'Av. José Abelardo Quiñones, Arequipa' },
            { coordenadas: { lat: -16.403500, lng: -71.547666 }, nombre: 'Ricardo Palma 305, Yanahuara' },
            { coordenadas: { lat: -16.404721, lng: -71.542879 }, nombre: 'Lima 408, Arequipa' },
            { coordenadas: { lat: -16.408666, lng: -71.537000 }, nombre: 'Av. Jorge Chávez 801, Arequipa' },
            { coordenadas: { lat: -16.402646, lng: -71.529500 }, nombre: 'Estación Goyeneche, Av. Jorge Chavez,' },
            { coordenadas: { lat: -16.399491, lng: -71.521671 }, nombre: 'Av. Independencia 10, Arequipa' },
            { coordenadas: { lat: -16.402970, lng: -71.516549 }, nombre: 'Av. Mariscal Castilla 637, Arequipa' },
            { coordenadas: { lat: -16.410490, lng: -71.513380 }, nombre: ' Av. Jesús 528, Arequipa' },
            { coordenadas: { lat: -16.427835, lng: -71.502801 }, nombre: 'John F. Kennedy 2116, Paucarpata' },
            { coordenadas: { lat: -16.425830, lng: -71.492770 }, nombre: 'Calle Inca Garcilaso de la Vega 302, Paucarpata' }
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
            { coordenadas: { lat: -16.425830, lng: -71.492770 }, nombre: 'Calle Inca Garcilaso de la Vega 302, Paucarpata' },
            { coordenadas: { lat: -16.427835, lng: -71.502801 }, nombre: 'John F. Kennedy 2116, Paucarpata 04008' },
            { coordenadas: { lat: -16.410468, lng: -71.513274 }, nombre: 'Av. Jesús 528, Arequipa 04001' },
            { coordenadas: { lat: -16.403266, lng: -71.516312 }, nombre: ' Mal. Zolezzi 102, Mariano Melgar' },
            { coordenadas: { lat: -16.399392, lng: -71.521586 }, nombre: 'Av. Mariscal Castilla 149, Miraflores' },
            { coordenadas: { lat: -16.398187, lng: -71.526713 }, nombre: 'Av. La Paz 503, Arequipa 04001' },
            { coordenadas: { lat: -16.395463, lng: -71.530834 }, nombre: 'C. Ayacucho, Arequipa 04001' },
            { coordenadas: { lat: -16.393299, lng: -71.537399 }, nombre: 'Puente Grau, Arequipa ' },
            { coordenadas: { lat: -16.392254, lng: -71.540129 }, nombre: 'Av. Ejército 505, Arequipa 04017' },
            { coordenadas: { lat: -16.390006, lng: -71.546472 }, nombre: 'Av. Ejército, Cayma 0401' },
            { coordenadas: { lat: -16.389147, lng: -71.548898 }, nombre: 'C. los Arces &, JF62+8FF, Av. Ejército, Cayma' },
            { coordenadas: { lat: -16.384107, lng: -71.555875 }, nombre: 'Av. Ejercito 714a, Cerro Colorado' },
            { coordenadas: { lat: -16.381007, lng: -71.556637 }, nombre: 'Av. Pumacahua 100, Arequipa' },
            { coordenadas: { lat: -16.379168, lng: -71.559184 }, nombre: 'Jorge Chavez 146-760, Cerro Colorado' },
            { coordenadas: { lat: -16.374349, lng: -71.561483 }, nombre: 'Mariano Melgar 625, Arequipa' },
            { coordenadas: { lat: -16.375036, lng: -71.566817 }, nombre: '27 de Noviembre 202, Cerro Colorado' },
            { coordenadas: { lat: -16.375233, lng: -71.567978 }, nombre: 'Av. Puno 1102, Cerro Colorado' },
            { coordenadas: { lat: -16.382885, lng: -71.575494 }, nombre: 'Av. San Martin, Arequipa' },
            { coordenadas: { lat: -16.384230, lng: -71.573870 }, nombre: 'Manco Capac 206, Arequipa' },
            { coordenadas: { lat: -16.384800, lng: -71.570220 }, nombre: 'Av. Perú 405, Cerro Colorado' }
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
            { coordenadas: { lat: -16.387058, lng: -71.575015 }, nombre: 'Av. Perú, Arequipa 04014' },
            { coordenadas: { lat: -16.392649, lng: -71.574616 }, nombre: 'Huascar, Arequipa 04014' },
            { coordenadas: { lat: -16.403220, lng: -71.573008 }, nombre: 'Av. Circunvalación 107, Cerro Colorado' },
            { coordenadas: { lat: -16.404376, lng: -71.573231 }, nombre: 'Av. Circunvalación 188, Arequipa' },
            { coordenadas: { lat: -16.403220, lng: -71.568348 }, nombre: 'Juan Santos Atahualpa, Arequipa' },
            { coordenadas: { lat: -16.400683, lng: -71.569132 }, nombre: 'Av. Buenos Aires 213, Cerro Colorado' },
            { coordenadas: { lat: -16.394982, lng: -71.569286 }, nombre: 'Confraternidad 107, Cerro Colorado' },
            { coordenadas: { lat: -16.392581, lng: -71.565814 }, nombre: 'Av. Nicolas de Pierola Mz.18, Cerro Colorado' },
            { coordenadas: { lat: -16.392562, lng: -71.556064 }, nombre: 'Urbanizacion San Pedro 1, Yanahuara' },
            { coordenadas: { lat: -16.388926, lng: -71.555101 }, nombre: 'Ca. San Jose n330, Arequipa ' },
            { coordenadas: { lat: -16.389280, lng: -71.548936 }, nombre: 'Av. Ejército 1005, Cayma' },
            { coordenadas: { lat: -16.391946, lng: -71.548793 }, nombre: 'Av. Trinidad Moran H-22 León XIII Cayma Cercado de Arequipa' },
            { coordenadas: { lat: -16.397905, lng: -71.545947 }, nombre: 'Av. José Abelardo Quiñones, Arequipa' },
            { coordenadas: { lat: -16.403500, lng: -71.547666 }, nombre: 'Ricardo Palma 305, Yanahuara' },
            { coordenadas: { lat: -16.404721, lng: -71.542879 }, nombre: 'Lima 408, Arequipa' },
            { coordenadas: { lat: -16.416222, lng: -71.533643 }, nombre: 'Matto 100, Arequipa' },
            { coordenadas: { lat: -16.421498, lng: -71.531358 }, nombre: 'Av. Daniel Alcides Carrión 213, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.425209, lng: -71.533374 }, nombre: 'Pje. Quiroz 101, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.428147, lng: -71.534175 }, nombre: 'Av. Cementerio, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.430168, lng: -71.534405 }, nombre: 'Av. Cementerio 336, José Luis Bustamante y Rivero' }
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
                { location: { lat: -16.399691, lng: -71.521836 }, stopover: true },
                { location: { lat: -16.398971, lng: -71.521357 }, stopover: true },
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
            { coordenadas: { lat: -16.430168, lng: -71.534405 }, nombre: 'Av. Cementerio 336, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.426127, lng: -71.515727 }, nombre: 'URBANIZACIÓN CASA BLANCA D-6, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.417877, lng: -71.515813 }, nombre: 'Av. Porongoche 528, Arequipa' },
            { coordenadas: { lat: -16.411832, lng: -71.512688 }, nombre: 'Av. Argentina 50, Paucarpata' },
            { coordenadas: { lat: -16.399691, lng: -71.521836 }, nombre: 'Av. Independencia 28, Arequipa' },
            { coordenadas: { lat: -16.398971, lng: -71.521357 }, nombre: 'Puente Arnao 113a, Miraflores' },
            { coordenadas: { lat: -16.398187, lng: -71.526713 }, nombre: 'Av. La Paz 503, Arequipa' },
            { coordenadas: { lat: -16.395463, lng: -71.530834 }, nombre: 'C. Ayacucho, Arequipa' },
            { coordenadas: { lat: -16.393299, lng: -71.537399 }, nombre: 'Puente Grau, Arequipa' },
            { coordenadas: { lat: -16.392254, lng: -71.540129 }, nombre: 'Av. Ejército 505, Arequipa' },
            { coordenadas: { lat: -16.389280, lng: -71.548936 }, nombre: 'Av. Ejército 1005, Cayma' },
            { coordenadas: { lat: -16.390889, lng: -71.552762 }, nombre: 'Urb. 12 de Octubre D-2 Cerro, Yanahuara' },
            { coordenadas: { lat: -16.392562, lng: -71.556064 }, nombre: 'Urbanizacion San Pedro 1, Yanahuara' },
            { coordenadas: { lat: -16.392581, lng: -71.565814 }, nombre: 'Av. Nicolas de Pierola Mz.18, Cerro Colorado' },
            { coordenadas: { lat: -16.394982, lng: -71.569286 }, nombre: 'Confraternidad 107, Cerro Colorado' },
            { coordenadas: { lat: -16.400683, lng: -71.569132 }, nombre: 'Av. Buenos Aires 213, Cerro Colorado' },
            { coordenadas: { lat: -16.404376, lng: -71.573231 }, nombre: 'Av. Circunvalación 188, Arequipa' },
            { coordenadas: { lat: -16.403220, lng: -71.573008 }, nombre: 'Av. Circunvalación 107, Cerro Colorado' },
            { coordenadas: { lat: -16.392649, lng: -71.574616 }, nombre: 'Huascar, Arequipa 04014' },
            { coordenadas: { lat: -16.387058, lng: -71.575015 }, nombre: 'Av. Perú, Arequipa' }
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
            { coordenadas: { lat: -16.46167, lng: -71.52433 }, nombre: 'Zafiros 200, Socabaya' },
            { coordenadas: { lat: -16.45603, lng: -71.51871 }, nombre: 'Alhelies 109, Socabaya' },
            { coordenadas: { lat: -16.45139, lng: -71.51439 }, nombre: 'Socabaya 04012,' },
            { coordenadas: { lat: -16.44785, lng: -71.51629 }, nombre: 'José Luis Bustamante 04009' },
            { coordenadas: { lat: -16.44333, lng: -71.52169 }, nombre: ' Av. Caracas 308, Arequipa ' },
            { coordenadas: { lat: -16.43652, lng: -71.53073 }, nombre: 'C. Aplao 101, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.43053, lng: -71.53271 }, nombre: '13 de Enero Mz. E Lote 1 Sección A, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.42578, lng: -71.53306 }, nombre: 'Av. Perú 3, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.42060, lng: -71.53138 }, nombre: 'Av. Daniel Alcides Carrión 197, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.41204, lng: -71.53475 }, nombre: 'HFP8+X4V, Arequipa 04002, Peru' },
            { coordenadas: { lat: -16.41035, lng: -71.53260 }, nombre: 'HFQ9+R27, Arequipa 04001, Peru' },
            { coordenadas: { lat: -16.40244, lng: -71.52509 }, nombre: 'Av. Independencia 424,' },
            { coordenadas: { lat: -16.40251, lng: -71.51781 }, nombre: 'Av. Republica de Venezuela 118, Arequipa ' },
            { coordenadas: { lat: -16.40419, lng: -71.51929 }, nombre: 'Urb. la Alborada, Arequipa ' },
            { coordenadas: { lat: -16.39944, lng: -71.51668 }, nombre: 'Sepúlveda 400, Miraflores' },
            { coordenadas: { lat: -16.39381, lng: -71.51144 }, nombre: 'JF4Q+F87, Miraflores 04004, Peru' },
            { coordenadas: { lat: -16.39379, lng: -71.51108 }, nombre: 'Calle 5 prolongación, C. Sanchez Trujillo Mz 2C, Miraflores' },
            { coordenadas: { lat: -16.39345, lng: -71.50936 }, nombre: 'Urb. Alameda salaverry Mz Q lote 9, Miraflores' },
            { coordenadas: { lat: -16.39401, lng: -71.50297 }, nombre: 'JF4W+8V3, Mariano Melgar 04006, Peru' }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta9'
    },

    Ruta9_Vuelta: {
        solicitud: {
            origin: { lat: -16.39400, lng: -71.50296 },
            destination: { lat: -16.46169, lng: -71.52431 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.396510, lng: -71.508320 }, stopover: true },
                { location: { lat: -16.392934, lng: -71.509574 }, stopover: true },
                { location: { lat: -16.392120, lng: -71.513850 }, stopover: true },
                { location: { lat: -16.390510, lng: -71.518317 }, stopover: true },
                { location: { lat: -16.394208, lng: -71.521430 }, stopover: true },
                { location: { lat: -16.393424, lng: -71.522591 }, stopover: true },
                { location: { lat: -16.401970, lng: -71.526990 }, stopover: true },
                { location: { lat: -16.404230, lng: -71.527332 }, stopover: true },
                { location: { lat: -16.412090, lng: -71.535270 }, stopover: true },
                { location: { lat: -16.415910, lng: -71.533860 }, stopover: true },
                { location: { lat: -16.430310, lng: -71.534440 }, stopover: true },
                { location: { lat: -16.441690, lng: -71.529040 }, stopover: true },
                { location: { lat: -16.443450, lng: -71.518470 }, stopover: true },
                { location: { lat: -16.455410, lng: -71.516440 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.394129, lng: -71.502966 }, nombre: 'JF4W+8V3, Mariano Melgar 04006' },
            { coordenadas: { lat: -16.393662, lng: -71.511054 }, nombre: 'Calle 5 prolongación, C. Sanchez Trujillo' },
            { coordenadas: { lat: -16.390521, lng: -71.518365 }, nombre: 'Ca. Ramon Castilla 503, Miraflores' },
            { coordenadas: { lat: -16.393582, lng: -71.522671 }, nombre: 'Av. San Martin 625, Miraflores' },
            { coordenadas: { lat: -16.397215, lng: -71.525116 }, nombre: 'Av. San Martin 100, Miraflores' },
            { coordenadas: { lat: -16.400957, lng: -71.527633 }, nombre: 'Av. Goyeneche 227, Arequipa' },
            { coordenadas: { lat: -16.404269, lng: -71.527420 }, nombre: '04730, Arequipa 04001, Peru' },
            { coordenadas: { lat: -16.408309, lng: -71.532270 }, nombre: 'Av. Independencia 1528, Arequipa' },
            { coordenadas: { lat: -16.411982, lng: -71.535213 }, nombre: 'Estación Venezuela, Daniel Alcides Carrion, Arequipa' },
            { coordenadas: { lat: -16.415289, lng: -71.534190 }, nombre: 'Hospital General, Arequipa' },
            { coordenadas: { lat: -16.421406, lng: -71.531356 }, nombre: 'Av. Daniel Alcides Carrión 213, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.425336, lng: -71.533428 }, nombre: ' Pje. Quiroz 101, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.430090, lng: -71.534449 }, nombre: 'Av. Cementerio 336, José Luis Bustamante y River' },
            { coordenadas: { lat: -16.434600, lng: -71.531542 }, nombre: 'Garcilaso de la Vega 602, Socabaya' },
            { coordenadas: { lat: -16.441966, lng: -71.528799 }, nombre: 'Oroya 100, Socabay' },
            { coordenadas: { lat: -16.443320, lng: -71.521352 }, nombre: 'Alfonso Ugarte 102, Socabaya' },
            { coordenadas: { lat: -16.447208, lng: -71.516246 }, nombre: 'Urb. La Breña E-3, José Luis Bustamante y Rivero' },
            { coordenadas: { lat: -16.449907, lng: -71.512435 }, nombre: 'GFXQ+X4G, José Luis Bustamante' },
            { coordenadas: { lat: -16.456454, lng: -71.517489 }, nombre: ' Arequipa 2401, Socabaya 04012,' },
            { coordenadas: { lat: -16.456454, lng: -71.517489 }, nombre: 'Zafiros 200, Socabaya ' },
            { coordenadas: { lat: -16.461628, lng: -71.524270 }, nombre: '2 do paradero Zafiros 200, Socabaya ' }
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
                { location: { lat: -16.429331, lng: -71.496263 }, stopover: true },
                { location: { lat: -16.429756, lng: -71.499702 }, stopover: true },
                { location: { lat: -16.428722, lng: -71.502831 }, stopover: true },
                { location: { lat: -16.422136, lng: -71.507444 }, stopover: true },
                { location: { lat: -16.417278, lng: -71.510184 }, stopover: true },
                { location: { lat: -16.412010, lng: -71.512590 }, stopover: true },
                { location: { lat: -16.411874, lng: -71.506238 }, stopover: true },
                { location: { lat: -16.410248, lng: -71.505025 }, stopover: true },
                { location: { lat: -16.40534, lng: -71.51252 }, stopover: true },
                { location: { lat: -16.403328, lng: -71.515660 }, stopover: true },
                { location: { lat: -16.401605, lng: -71.518252 }, stopover: true },
                { location: { lat: -16.398378, lng: -71.515936 }, stopover: true },
                { location: { lat: -16.391949, lng: -71.524430 }, stopover: true },
                { location: { lat: -16.39509, lng: -71.53233 }, stopover: true },
                { location: { lat: -16.393570, lng: -71.536698 }, stopover: true },
                { location: { lat: -16.398722, lng: -71.538709 }, stopover: true },
                { location: { lat: -16.396088, lng: -71.544949 }, stopover: true },
                { location: { lat: -16.40194, lng: -71.54705 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.429262, lng: -71.491125 }, nombre: '' },
            { coordenadas: { lat: -16.429747, lng: -71.499679 }, nombre: '' },
            { coordenadas: { lat: -16.428697, lng: -71.502789 }, nombre: '' },
            { coordenadas: { lat: -16.422173, lng: -71.507363 }, nombre: '' },
            { coordenadas: { lat: -16.417256, lng: -71.510156 }, nombre: '' },
            { coordenadas: { lat: -16.412197, lng: -71.512481 }, nombre: '' },
            { coordenadas: { lat: -16.405368, lng: -71.512428 }, nombre: '' },
            { coordenadas: { lat: -16.403309, lng: -71.515654 }, nombre: '' },
            { coordenadas: { lat: -16.397842, lng: -71.516621 }, nombre: '' },
            { coordenadas: { lat: -16.393912, lng: -71.521913 }, nombre: '' },
            { coordenadas: { lat: -16.393360, lng: -71.528781 }, nombre: '' },
            { coordenadas: { lat: -16.394195, lng: -71.530874 }, nombre: '' },
            { coordenadas: { lat: -16.395081, lng: -71.532306 }, nombre: '' },
            { coordenadas: { lat: -16.393937, lng: -71.535667 }, nombre: '' },
            { coordenadas: { lat: -16.394113, lng: -71.536919 }, nombre: '' },
            { coordenadas: { lat: -16.396761, lng: -71.537960 }, nombre: '' },
            { coordenadas: { lat: -16.398671, lng: -71.538730 }, nombre: '' },
            { coordenadas: { lat: -16.396775, lng: -71.543658 }, nombre: '' },
            { coordenadas: { lat: -16.397163, lng: -71.545397 }, nombre: '' },
            { coordenadas: { lat: -16.399461, lng: -71.546338 }, nombre: '' },
            { coordenadas: { lat: -16.401929, lng: -71.547093 }, nombre: '' }
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
            { coordenadas: { lat: -16.403736, lng: -71.547759 }, nombre: '' },
            { coordenadas: { lat: -16.404374, lng: -71.543042 }, nombre: '' },
            { coordenadas: { lat: -16.405660, lng: -71.542283 }, nombre: '' },
            { coordenadas: { lat: -16.408707, lng: -71.541102 }, nombre: '' },
            { coordenadas: { lat: -16.407125, lng: -71.539192 }, nombre: '' },
            { coordenadas: { lat: -16.408299, lng: -71.538196 }, nombre: '' },
            { coordenadas: { lat: -16.410193, lng: -71.536186 }, nombre: '' },
            { coordenadas: { lat: -16.413341, lng: -71.535068 }, nombre: '' },
            { coordenadas: { lat: -16.415582, lng: -71.534069 }, nombre: '' },
            { coordenadas: { lat: -16.421310, lng: -71.531340 }, nombre: '' },
            { coordenadas: { lat: -16.425094, lng: -71.533336 }, nombre: '' },
            { coordenadas: { lat: -16.430359, lng: -71.534402 }, nombre: '' },
            { coordenadas: { lat: -16.429743, lng: -71.526694 }, nombre: '' },
            { coordenadas: { lat: -16.427296, lng: -71.518592 }, nombre: '' },
            { coordenadas: { lat: -16.425082, lng: -71.513470 }, nombre: '' },
            { coordenadas: { lat: -16.423293, lng: -71.509753 }, nombre: '' },
            { coordenadas: { lat: -16.422306, lng: -71.507636 }, nombre: '' },
            { coordenadas: { lat: -16.424746, lng: -71.505882 }, nombre: '' },
            { coordenadas: { lat: -16.429367, lng: -71.496306 }, nombre: '' },
            { coordenadas: { lat: -16.429310, lng: -71.491165 }, nombre: '' }
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
            { coordenadas: { lat: -16.359427, lng: -71.509089 }, nombre: '' },
            { coordenadas: { lat: -16.362028, lng: -71.513599 }, nombre: '' },
            { coordenadas: { lat: -16.364530, lng: -71.515414 }, nombre: '' },
            { coordenadas: { lat: -16.367270, lng: -71.519366 }, nombre: '' },
            { coordenadas: { lat: -16.368882, lng: -71.519305 }, nombre: '' },
            { coordenadas: { lat: -16.371222, lng: -71.516691 }, nombre: '' },
            { coordenadas: { lat: -16.374671, lng: -71.522629 }, nombre: '' },
            { coordenadas: { lat: -16.378040, lng: -71.524532 }, nombre: '' },
            { coordenadas: { lat: -16.378157, lng: -71.521353 }, nombre: '' },
            { coordenadas: { lat: -16.379410, lng: -71.520118 }, nombre: '' },
            { coordenadas: { lat: -16.383255, lng: -71.524638 }, nombre: '' },
            { coordenadas: { lat: -16.389452, lng: -71.526704 }, nombre: '' },
            { coordenadas: { lat: -16.394248, lng: -71.521652 }, nombre: '' },
            { coordenadas: { lat: -16.396579, lng: -71.518624 }, nombre: '' },
            { coordenadas: { lat: -16.400129, lng: -71.520316 }, nombre: '' },
            { coordenadas: { lat: -16.402356, lng: -71.525069 }, nombre: '' },
            { coordenadas: { lat: -16.408386, lng: -71.532386 }, nombre: '' },
            { coordenadas: { lat: -16.416374, lng: -71.533496 }, nombre: '' },
            { coordenadas: { lat: -16.420565, lng: -71.539217 }, nombre: '' },
            { coordenadas: { lat: -16.423038, lng: -71.542801 }, nombre: '' }
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
            { coordenadas: { lat: -16.4223778, lng: -71.5440237 }, nombre: '' },
            { coordenadas: { lat: -16.4215858, lng: -71.5414179 }, nombre: '' },
            { coordenadas: { lat: -16.4163267, lng: -71.5332190 }, nombre: '' },
            { coordenadas: { lat: -16.4133469, lng: -71.5348413 }, nombre: '' },
            { coordenadas: { lat: -16.4117572, lng: -71.5344432 }, nombre: '' },
            { coordenadas: { lat: -16.4109596, lng: -71.5333157 }, nombre: '' },
            { coordenadas: { lat: -16.4057026, lng: -71.5289640 }, nombre: '' },
            { coordenadas: { lat: -16.4044569, lng: -71.5274436 }, nombre: '' },
            { coordenadas: { lat: -16.4058452, lng: -71.5221469 }, nombre: '' },
            { coordenadas: { lat: -16.4053539, lng: -71.5212372 }, nombre: '' },
            { coordenadas: { lat: -16.3934125, lng: -71.5224761 }, nombre: '' },
            { coordenadas: { lat: -16.3887705, lng: -71.5262105 }, nombre: '' },
            { coordenadas: { lat: -16.3786713, lng: -71.5232247 }, nombre: '' },
            { coordenadas: { lat: -16.3782878, lng: -71.5240210 }, nombre: '' },
            { coordenadas: { lat: -16.3779285, lng: -71.5245938 }, nombre: '' },
            { coordenadas: { lat: -16.3796659, lng: -71.5266417 }, nombre: '' },
            { coordenadas: { lat: -16.3784089, lng: -71.5277752 }, nombre: '' },
            { coordenadas: { lat: -16.3714912, lng: -71.5166505 }, nombre: '' }
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
            { coordenadas: { lat: -16.403722, lng: -71.494809 }, nombre: '' },
            { coordenadas: { lat: -16.404709, lng: -71.498214 }, nombre: '' },
            { coordenadas: { lat: -16.405002, lng: -71.501107 }, nombre: '' },
            { coordenadas: { lat: -16.403398, lng: -71.502156 }, nombre: '' },
            { coordenadas: { lat: -16.400429, lng: -71.504589 }, nombre: '' },
            { coordenadas: { lat: -16.401512, lng: -71.508537 }, nombre: '' },
            { coordenadas: { lat: -16.402070, lng: -71.509843 }, nombre: '' },
            { coordenadas: { lat: -16.403160, lng: -71.511711 }, nombre: '' },
            { coordenadas: { lat: -16.403919, lng: -71.512903 }, nombre: '' },
            { coordenadas: { lat: -16.402451, lng: -71.514979 }, nombre: '' },
            { coordenadas: { lat: -16.401719, lng: -71.518078 }, nombre: '' },
            { coordenadas: { lat: -16.403047, lng: -71.518197 }, nombre: '' },
            { coordenadas: { lat: -16.405092, lng: -71.521061 }, nombre: '' },
            { coordenadas: { lat: -16.406350, lng: -71.523071 }, nombre: '' },
            { coordenadas: { lat: -16.408109, lng: -71.526702 }, nombre: '' },
            { coordenadas: { lat: -16.409166, lng: -71.530458 }, nombre: '' },
            { coordenadas: { lat: -16.408893, lng: -71.532837 }, nombre: '' },
            { coordenadas: { lat: -16.407710, lng: -71.533938 }, nombre: '' }
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
            { coordenadas: { lat: -16.407710, lng: -71.533938 }, nombre: '' },
            { coordenadas: { lat: -16.406093, lng: -71.533732 }, nombre: '' },
            { coordenadas: { lat: -16.405042, lng: -71.532517 }, nombre: '' },
            { coordenadas: { lat: -16.404175, lng: -71.531462 }, nombre: '' },
            { coordenadas: { lat: -16.402534, lng: -71.529420 }, nombre: '' },
            { coordenadas: { lat: -16.404259, lng: -71.527511 }, nombre: '' },
            { coordenadas: { lat: -16.402499, lng: -71.525137 }, nombre: '' },
            { coordenadas: { lat: -16.400874, lng: -71.523139 }, nombre: '' },
            { coordenadas: { lat: -16.399566, lng: -71.521671 }, nombre: '' },
            { coordenadas: { lat: -16.399360, lng: -71.518576 }, nombre: '' },
            { coordenadas: { lat: -16.399557, lng: -71.515725 }, nombre: '' },
            { coordenadas: { lat: -16.399721, lng: -71.511831 }, nombre: '' },
            { coordenadas: { lat: -16.402422, lng: -71.514933 }, nombre: '' },
            { coordenadas: { lat: -16.403160, lng: -71.511711 }, nombre: '' },
            { coordenadas: { lat: -16.403160, lng: -71.511711 }, nombre: '' },
            { coordenadas: { lat: -16.402070, lng: -71.509843 }, nombre: '' },
            { coordenadas: { lat: -16.400483, lng: -71.507091 }, nombre: '' },
            { coordenadas: { lat: -16.405056, lng: -71.502802 }, nombre: '' },
            { coordenadas: { lat: -16.404836, lng: -71.498590 }, nombre: '' },
            { coordenadas: { lat: -16.403722, lng: -71.494809 }, nombre: '' }
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
            { coordenadas: { lat: -16.337710, lng: -71.552126 }, nombre: '' },
            { coordenadas: { lat: -16.330666, lng: -71.542712 }, nombre: '' },
            { coordenadas: { lat: -16.354867, lng: -71.541874 }, nombre: '' },
            { coordenadas: { lat: -16.382219, lng: -71.545523 }, nombre: '' },
            { coordenadas: { lat: -16.389605, lng: -71.547600 }, nombre: '' },
            { coordenadas: { lat: -16.392522, lng: -71.540168 }, nombre: '' },
            { coordenadas: { lat: -16.392601, lng: -71.537432 }, nombre: '' },
            { coordenadas: { lat: -16.392931, lng: -71.535040 }, nombre: '' },
            { coordenadas: { lat: -16.391723, lng: -71.530674 }, nombre: '' },
            { coordenadas: { lat: -16.394476, lng: -71.526156 }, nombre: '' },
            { coordenadas: { lat: -16.398861, lng: -71.521246 }, nombre: '' },
            { coordenadas: { lat: -16.399562, lng: -71.515512 }, nombre: '' },
            { coordenadas: { lat: -16.405689, lng: -71.522199 }, nombre: '' },
            { coordenadas: { lat: -16.406574, lng: -71.530123 }, nombre: '' }
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
                { location: { lat: -16.396354, lng: -71.528536 }, stopover: true },
                { location: { lat: -16.395382, lng: -71.531432 }, stopover: true },
                { location: { lat: -16.393327, lng: -71.537382 }, stopover: true },
                { location: { lat: -16.391420, lng: -71.542485 }, stopover: true },
                { location: { lat: -16.389595, lng: -71.547535 }, stopover: true },
                { location: { lat: -16.345476, lng: -71.5415344 }, stopover: true },
                { location: { lat: -16.343326, lng: -71.541279 }, stopover: true },
                { location: { lat: -16.343400, lng: -71.540690 }, stopover: true },
                { location: { lat: -16.333291, lng: -71.538470 }, stopover: true },
                { location: { lat: -16.331683, lng: -71.541877 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.406574, lng: -71.530123 }, nombre: '' },
            { coordenadas: { lat: -16.401938, lng: -71.524481 }, nombre: '' },
            { coordenadas: { lat: -16.399958, lng: -71.526221 }, nombre: '' },
            { coordenadas: { lat: -16.396386, lng: -71.528331 }, nombre: '' },
            { coordenadas: { lat: -16.395420, lng: -71.531290 }, nombre: '' },
            { coordenadas: { lat: -16.393322, lng: -71.537322 }, nombre: '' },
            { coordenadas: { lat: -16.391487, lng: -71.542318 }, nombre: '' },
            { coordenadas: { lat: -16.389595, lng: -71.547535 }, nombre: '' },
            { coordenadas: { lat: -16.381820, lng: -71.545401 }, nombre: '' },
            { coordenadas: { lat: -16.361935, lng: -71.543956 }, nombre: '' },
            { coordenadas: { lat: -16.354821, lng: -71.542461 }, nombre: '' },
            { coordenadas: { lat: -16.344880, lng: -71.541455 }, nombre: '' },
            { coordenadas: { lat: -16.337829, lng: -71.539906 }, nombre: '' },
            { coordenadas: { lat: -16.333291, lng: -71.538470 }, nombre: '' },
            { coordenadas: { lat: -16.331683, lng: -71.541877 }, nombre: '' },
            { coordenadas: { lat: -16.330101, lng: -71.542968 }, nombre: '' },
            { coordenadas: { lat: -16.337729, lng: -71.552171 }, nombre: '' }
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
            { coordenadas: { lat: -16.461711, lng: -71.524362 }, nombre: '' },
            { coordenadas: { lat: -16.459751, lng: -71.522359 }, nombre: '' },
            { coordenadas: { lat: -16.456411, lng: -71.517414 }, nombre: '' },
            { coordenadas: { lat: -16.447123, lng: -71.516316 }, nombre: '' },
            { coordenadas: { lat: -16.444272, lng: -71.518061 }, nombre: '' },
            { coordenadas: { lat: -16.442239, lng: -71.525039 }, nombre: '' },
            { coordenadas: { lat: -16.441936, lng: -71.528853 }, nombre: '' },
            { coordenadas: { lat: -16.430844, lng: -71.532754 }, nombre: '' },
            { coordenadas: { lat: -16.425645, lng: -71.533021 }, nombre: '' },
            { coordenadas: { lat: -16.417242, lng: -71.532626 }, nombre: '' },
            { coordenadas: { lat: -16.416391, lng: -71.533317 }, nombre: '' },
            { coordenadas: { lat: -16.409507, lng: -71.536577 }, nombre: '' },
            { coordenadas: { lat: -16.406727, lng: -71.539358 }, nombre: '' },
            { coordenadas: { lat: -16.404309, lng: -71.542514 }, nombre: '' },
            { coordenadas: { lat: -16.404293, lng: -71.547908 }, nombre: '' },
            { coordenadas: { lat: -16.395193, lng: -71.548271 }, nombre: '' },
            { coordenadas: { lat: -16.389966, lng: -71.547015 }, nombre: '' }
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
            { coordenadas: { lat: -16.389966, lng: -71.547015 }, nombre: '' },
            { coordenadas: { lat: -16.392522, lng: -71.540168 }, nombre: '' },
            { coordenadas: { lat: -16.392601, lng: -71.537432 }, nombre: '' },
            { coordenadas: { lat: -16.392931, lng: -71.535040 }, nombre: '' },
            { coordenadas: { lat: -16.391723, lng: -71.530674 }, nombre: '' },
            { coordenadas: { lat: -16.391944, lng: -71.524411 }, nombre: '' },
            { coordenadas: { lat: -16.387459, lng: -71.515628 }, nombre: '' },
            { coordenadas: { lat: -16.379378, lng: -71.510543 }, nombre: '' },
            { coordenadas: { lat: -16.392053, lng: -71.513920 }, nombre: '' },
            { coordenadas: { lat: -16.397531, lng: -71.520779 }, nombre: '' },
            { coordenadas: { lat: -16.400241, lng: -71.520347 }, nombre: '' },
            { coordenadas: { lat: -16.401999, lng: -71.524520 }, nombre: '' },
            { coordenadas: { lat: -16.405521, lng: -71.528895 }, nombre: '' },
            { coordenadas: { lat: -16.453479, lng: -71.513214 }, nombre: '' },
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta14'
    },

    Ruta15_Ida: {
        solicitud: {
            origin: { lat: -16.41492, lng: -71.49246 },
            destination: { lat: -16.405855, lng: -71.531640 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.415288, lng: -71.494275 }, stopover: true },
                { location: { lat: -16.416525, lng: -71.494253 }, stopover: true },
                { location: { lat: -16.41686, lng: -71.49663 }, stopover: true },
                { location: { lat: -16.41557, lng: -71.49719 }, stopover: true },
                { location: { lat: -16.41287, lng: -71.50112 }, stopover: true },
                { location: { lat: -16.411645, lng: -71.502947 }, stopover: true },
                { location: { lat: -16.410169, lng: -71.505122 }, stopover: true },
                { location: { lat: -16.408048, lng: -71.508369 }, stopover: true },
                { location: { lat: -16.406510, lng: -71.510743 }, stopover: true },
                { location: { lat: -16.405188, lng: -71.512756 }, stopover: true },
                { location: { lat: -16.404385, lng: -71.514035 }, stopover: true },
                { location: { lat: -16.402699, lng: -71.516648 }, stopover: true },
                { location: { lat: -16.401509, lng: -71.518382 }, stopover: true },
                { location: { lat: -16.399562, lng: -71.521684 }, stopover: true },
                { location: { lat: -16.402047, lng: -71.524635 }, stopover: true },
                { location: { lat: -16.404558, lng: -71.527705 }, stopover: true },
                { location: { lat: -16.407251, lng: -71.530956 }, stopover: true },
                { location: { lat: -16.40881, lng: -71.53290 }, stopover: true },
                { location: { lat: -16.407588, lng: -71.533875 }, stopover: true },
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.414941, lng: -71.492484 }, nombre: 'Cusco y Sta. Clara' },
            { coordenadas: { lat: -16.415248, lng: -71.494264 }, nombre: 'Cusco y Los Alpes' },
            { coordenadas: { lat: -16.416506, lng: -71.494157 }, nombre: 'Roma y Los Alpes' },
            { coordenadas: { lat: -16.416740, lng: -71.495928 }, nombre: 'Roma y Jorge Chavez' },
            { coordenadas: { lat: -16.416825, lng: -71.496591 }, nombre: 'Roma y Av. Mariscal Castilla' },
            { coordenadas: { lat: -16.413102, lng: -71.500701 }, nombre: 'Av. Mariscal Castilla y Salaverry' },
            { coordenadas: { lat: -16.411851, lng: -71.502667 }, nombre: 'Av. Mariscal Castilla y Av. Argentina' },
            { coordenadas: { lat: -16.410201, lng: -71.505018 }, nombre: 'Av. Mariscal Castilla y El Triunfo' },
            { coordenadas: { lat: -16.408195, lng: -71.508145 }, nombre: 'Av. Mariscal Castilla y 30 de Agosto' },
            { coordenadas: { lat: -16.406645, lng: -71.510465 }, nombre: 'Av. Mariscal Castilla y Comandante Canga' },
            { coordenadas: { lat: -16.405289, lng: -71.512523 }, nombre: 'Av. Mariscal Castilla y Av. Simón Bolivar' },
            { coordenadas: { lat: -16.404452, lng: -71.513852 }, nombre: 'Av. Mariscal Castilla y Av. Lima' },
            { coordenadas: { lat: -16.402827, lng: -71.516451 }, nombre: 'Av. Mariscal Castilla y Chorrillos' },
            { coordenadas: { lat: -16.401688, lng: -71.518102 }, nombre: 'Av. Mariscal Castilla y Palacios' },
            { coordenadas: { lat: -16.399431, lng: -71.521521 }, nombre: 'Av. Mariscal Castilla y Puente Arnao' },
            { coordenadas: { lat: -16.401884, lng: -71.524453 }, nombre: 'Av. Independencia y La Salle' },
            { coordenadas: { lat: -16.404287, lng: -71.527420 }, nombre: 'Av. Independencia y Paucarpata' },
            { coordenadas: { lat: -16.406948, lng: -71.530622 }, nombre: 'Av. Independencia y Victor Lira' },
            { coordenadas: { lat: -16.408763, lng: -71.532894 }, nombre: 'Av. Independencia y Av. Garci de Carbajal' },
            { coordenadas: { lat: -16.407692, lng: -71.533936 }, nombre: 'Av. Garci de Carbajal y C. Mayta Capac' },
            { coordenadas: { lat: -16.405893, lng: -71.531662 }, nombre: 'C. Mayta Capac y Victor Lira' }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta15'
    },

    Ruta15_Vuelta: {
        solicitud: {
            origin: { lat: -16.405855, lng: -71.531640 },
            destination: { lat: -16.41492, lng: -71.49246 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.40662, lng: -71.53105 }, stopover: true },
                { location: { lat: -16.40698, lng: -71.53064 }, stopover: true },
                { location: { lat: -16.404398, lng: -71.527358 }, stopover: true },
                { location: { lat: -16.40650, lng: -71.52521 }, stopover: true },
                { location: { lat: -16.40763, lng: -71.52700 }, stopover: true },
                { location: { lat: -16.40823, lng: -71.52671 }, stopover: true },
                { location: { lat: -16.40432, lng: -71.51945 }, stopover: true },
                { location: { lat: -16.403823, lng: -71.518866 }, stopover: true },
                { location: { lat: -16.402555, lng: -71.517132 }, stopover: true },
                { location: { lat: -16.404704, lng: -71.513648 }, stopover: true },
                { location: { lat: -16.406891, lng: -71.510351 }, stopover: true },
                { location: { lat: -16.407722, lng: -71.509040 }, stopover: true },
                { location: { lat: -16.409620, lng: -71.506134 }, stopover: true },
                { location: { lat: -16.410344, lng: -71.505030 }, stopover: true },
                { location: { lat: -16.411117, lng: -71.503793 }, stopover: true },
                { location: { lat: -16.412217, lng: -71.502148 }, stopover: true },
                { location: { lat: -16.413290, lng: -71.500518 }, stopover: true },
                { location: { lat: -16.414334, lng: -71.498933 }, stopover: true },
                { location: { lat: -16.41549, lng: -71.49726 }, stopover: true },
                { location: { lat: -16.41684, lng: -71.49663 }, stopover: true },
                { location: { lat: -16.41650, lng: -71.49409 }, stopover: true },
                { location: { lat: -16.41523, lng: -71.49429 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.405880, lng: -71.531609 }, nombre: '' },
            { coordenadas: { lat: -16.406972, lng: -71.530688 }, nombre: '' },
            { coordenadas: { lat: -16.404405, lng: -71.527465 }, nombre: '' },
            { coordenadas: { lat: -16.408085, lng: -71.526767 }, nombre: '' },
            { coordenadas: { lat: -16.404361, lng: -71.519511 }, nombre: '' },
            { coordenadas: { lat: -16.402466, lng: -71.517523 }, nombre: '' },
            { coordenadas: { lat: -16.405498, lng: -71.515520 }, nombre: '' },
            { coordenadas: { lat: -16.404548, lng: -71.513906 }, nombre: '' },
            { coordenadas: { lat: -16.406530, lng: -71.510884 }, nombre: '' },
            { coordenadas: { lat: -16.407595, lng: -71.509244 }, nombre: '' },
            { coordenadas: { lat: -16.409440, lng: -71.506484 }, nombre: '' },
            { coordenadas: { lat: -16.410225, lng: -71.505253 }, nombre: '' },
            { coordenadas: { lat: -16.410972, lng: -71.504035 }, nombre: '' },
            { coordenadas: { lat: -16.412086, lng: -71.502399 }, nombre: '' },
            { coordenadas: { lat: -16.413010, lng: -71.500945 }, nombre: '' },
            { coordenadas: { lat: -16.414211, lng: -71.499164 }, nombre: '' },
            { coordenadas: { lat: -16.416856, lng: -71.496647 }, nombre: '' },
            { coordenadas: { lat: -16.415251, lng: -71.494262 }, nombre: '' },
            { coordenadas: { lat: -16.414941, lng: -71.492484 }, nombre: '' }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta15'
    },

    Ruta16_Ida: {
        solicitud: {
            origin: { lat: -16.415687, lng: -71.481059 },
            destination: { lat: -16.422519, lng: -71.544020 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.416363, lng: -71.481325 }, stopover: true },
                { location: { lat: -16.414558, lng: -71.482298 }, stopover: true },
                { location: { lat: -16.416449, lng: -71.491472 }, stopover: true },
                { location: { lat: -16.417230, lng: -71.491080 }, stopover: true },
                { location: { lat: -16.419445, lng: -71.494501 }, stopover: true },
                { location: { lat: -16.421898, lng: -71.498287 }, stopover: true },
                { location: { lat: -16.421304, lng: -71.499100 }, stopover: true },
                { location: { lat: -16.419715, lng: -71.501526 }, stopover: true },
                { location: { lat: -16.418156, lng: -71.503852 }, stopover: true },
                { location: { lat: -16.416906, lng: -71.505727 }, stopover: true },
                { location: { lat: -16.413934, lng: -71.510131 }, stopover: true },
                { location: { lat: -16.411764, lng: -71.512674 }, stopover: true },
                { location: { lat: -16.409550, lng: -71.506064 }, stopover: true },
                { location: { lat: -16.401694, lng: -71.518093 }, stopover: true },
                { location: { lat: -16.402056, lng: -71.524616 }, stopover: true },
                { location: { lat: -16.404527, lng: -71.527670 }, stopover: true },
                { location: { lat: -16.409997, lng: -71.534375 }, stopover: true },
                { location: { lat: -16.416551, lng: -71.533385 }, stopover: true },
                { location: { lat: -16.423494, lng: -71.532151 }, stopover: true },
                { location: { lat: -16.425256, lng: -71.533372 }, stopover: true },
                { location: { lat: -16.424573, lng: -71.537604 }, stopover: true },
                { location: { lat: -16.422519, lng: -71.544020 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.415687, lng: -71.481059 }, nombre: '' },
            { coordenadas: { lat: -16.414957, lng: -71.482207 }, nombre: '' },
            { coordenadas: { lat: -16.416374, lng: -71.491533 }, nombre: '' },
            { coordenadas: { lat: -16.417192, lng: -71.490997 }, nombre: '' },
            { coordenadas: { lat: -16.419366, lng: -71.494388 }, nombre: '' },
            { coordenadas: { lat: -16.421863, lng: -71.498269 }, nombre: '' },
            { coordenadas: { lat: -16.421304, lng: -71.499081 }, nombre: '' },
            { coordenadas: { lat: -16.419748, lng: -71.501452 }, nombre: '' },
            { coordenadas: { lat: -16.418202, lng: -71.503757 }, nombre: '' },
            { coordenadas: { lat: -16.416961, lng: -71.505599 }, nombre: '' },
            { coordenadas: { lat: -16.413997, lng: -71.510035 }, nombre: '' },
            { coordenadas: { lat: -16.411856, lng: -71.512615 }, nombre: '' },
            { coordenadas: { lat: -16.407584, lng: -71.514463 }, nombre: '' },
            { coordenadas: { lat: -16.401931, lng: -71.517658 }, nombre: '' },
            { coordenadas: { lat: -16.401852, lng: -71.524443 }, nombre: '' },
            { coordenadas: { lat: -16.404277, lng: -71.527423 }, nombre: '' },
            { coordenadas: { lat: -16.416436, lng: -71.533493 }, nombre: '' },
            { coordenadas: { lat: -16.425214, lng: -71.533381 }, nombre: '' },
            { coordenadas: { lat: -16.424623, lng: -71.537356 }, nombre: '' },
            { coordenadas: { lat: -16.422482, lng: -71.543998 }, nombre: '' }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta16'
    },

    Ruta16_Vuelta: {
        solicitud: {
            origin: { lat: -16.422519, lng: -71.544020 },
            destination: { lat: -16.415687, lng: -71.481059 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.420168, lng: -71.538024 }, stopover: true },
                { location: { lat: -16.416366, lng: -71.533335 }, stopover: true },
                { location: { lat: -16.410813, lng: -71.533231 }, stopover: true },
                { location: { lat: -16.408767, lng: -71.532952 }, stopover: true },
                { location: { lat: -16.404815, lng: -71.532234 }, stopover: true },
                { location: { lat: -16.402455, lng: -71.529324 }, stopover: true },
                { location: { lat: -16.399859, lng: -71.526131 }, stopover: true },
                { location: { lat: -16.398090, lng: -71.523896 }, stopover: true },
                { location: { lat: -16.401078, lng: -71.519241 }, stopover: true },
                { location: { lat: -16.402931, lng: -71.516571 }, stopover: true },
                { location: { lat: -16.411913, lng: -71.512590 }, stopover: true },
                { location: { lat: -16.416864, lng: -71.505798 }, stopover: true },
                { location: { lat: -16.419313, lng: -71.502145 }, stopover: true },
                { location: { lat: -16.420984, lng: -71.499634 }, stopover: true },
                { location: { lat: -16.421881, lng: -71.498247 }, stopover: true },
                { location: { lat: -16.416782, lng: -71.490627 }, stopover: true },
                { location: { lat: -16.415208, lng: -71.482277 }, stopover: true },
                { location: { lat: -16.416301, lng: -71.481631 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.422482, lng: -71.543998 }, nombre: '' },
            { coordenadas: { lat: -16.420349, lng: -71.538283 }, nombre: '' },
            { coordenadas: { lat: -16.416409, lng: -71.533253 }, nombre: '' },
            { coordenadas: { lat: -16.410877, lng: -71.533310 }, nombre: '' },
            { coordenadas: { lat: -16.408833, lng: -71.532856 }, nombre: '' },
            { coordenadas: { lat: -16.404901, lng: -71.532332 }, nombre: '' },
            { coordenadas: { lat: -16.402540, lng: -71.529401 }, nombre: '' },
            { coordenadas: { lat: -16.400045, lng: -71.526315 }, nombre: '' },
            { coordenadas: { lat: -16.398129, lng: -71.523925 }, nombre: '' },
            { coordenadas: { lat: -16.401035, lng: -71.519330 }, nombre: '' },
            { coordenadas: { lat: -16.402709, lng: -71.516916 }, nombre: '' },
            { coordenadas: { lat: -16.411832, lng: -71.512658 }, nombre: '' },
            { coordenadas: { lat: -16.416808, lng: -71.505883 }, nombre: '' },
            { coordenadas: { lat: -16.419231, lng: -71.502285 }, nombre: '' },
            { coordenadas: { lat: -16.420963, lng: -71.499699 }, nombre: '' },
            { coordenadas: { lat: -16.421904, lng: -71.498309 }, nombre: '' },
            { coordenadas: { lat: -16.417192, lng: -71.490994 }, nombre: '' },
            { coordenadas: { lat: -16.414970, lng: -71.482243 }, nombre: '' },
            { coordenadas: { lat: -16.415687, lng: -71.481059 }, nombre: '' }
        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta16'
    },

    Ruta17_Ida: {
        solicitud: {
            origin: { lat: -16.457464, lng: -71.553470 },
            destination: { lat: -16.404309, lng: -71.527442 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.457238, lng: -71.553360 }, stopover: true },
                { location: { lat: -16.453938, lng: -71.552025 }, stopover: true },
                { location: { lat: -16.451607, lng: -71.554851 }, stopover: true },
                { location: { lat: -16.449238, lng: -71.552726 }, stopover: true },
                { location: { lat: -16.447756, lng: -71.551539 }, stopover: true },
                { location: { lat: -16.444973, lng: -71.553906 }, stopover: true },
                { location: { lat: -16.443029, lng: -71.555939 }, stopover: true },
                { location: { lat: -16.440021, lng: -71.558939 }, stopover: true },
                { location: { lat: -16.438068, lng: -71.561111 }, stopover: true },
                { location: { lat: -16.435539, lng: -71.562153 }, stopover: true },
                { location: { lat: -16.433670, lng: -71.560891 }, stopover: true },
                { location: { lat: -16.431590, lng: -71.561459 }, stopover: true },
                { location: { lat: -16.425311, lng: -71.556492 }, stopover: true },
                { location: { lat: -16.417561, lng: -71.549722 }, stopover: true },
                { location: { lat: -16.407839, lng: -71.541665 }, stopover: true },
                { location: { lat: -16.405861, lng: -71.540140 }, stopover: true },
                { location: { lat: -16.407653, lng: -71.538669 }, stopover: true },
                { location: { lat: -16.408914, lng: -71.537491 }, stopover: true },
                { location: { lat: -16.407574, lng: -71.535642 }, stopover: true },
                { location: { lat: -16.405998, lng: -71.533711 }, stopover: true },
                { location: { lat: -16.404815, lng: -71.532246 }, stopover: true },
                { location: { lat: -16.402552, lng: -71.529333 }, stopover: true },
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.457495, lng: -71.553456 }, nombre: '' },
            { coordenadas: { lat: -16.454059, lng: -71.551968 }, nombre: '' },
            { coordenadas: { lat: -16.451625, lng: -71.554773 }, nombre: '' },
            { coordenadas: { lat: -16.449373, lng: -71.552765 }, nombre: '' },
            { coordenadas: { lat: -16.447824, lng: -71.551574 }, nombre: '' },
            { coordenadas: { lat: -16.445044, lng: -71.553789 }, nombre: '' },
            { coordenadas: { lat: -16.443232, lng: -71.555744 }, nombre: '' },
            { coordenadas: { lat: -16.440109, lng: -71.558928 }, nombre: '' },
            { coordenadas: { lat: -16.438159, lng: -71.561045 }, nombre: '' },
            { coordenadas: { lat: -16.435799, lng: -71.562146 }, nombre: '' },
            { coordenadas: { lat: -16.433926, lng: -71.561266 }, nombre: '' },
            { coordenadas: { lat: -16.431596, lng: -71.561566 }, nombre: '' },
            { coordenadas: { lat: -16.425467, lng: -71.556556 }, nombre: '' },
            { coordenadas: { lat: -16.417991, lng: -71.550118 }, nombre: '' },
            { coordenadas: { lat: -16.408094, lng: -71.541803 }, nombre: '' },
            { coordenadas: { lat: -16.405833, lng: -71.540123 }, nombre: '' },
            { coordenadas: { lat: -16.407579, lng: -71.538789 }, nombre: '' },
            { coordenadas: { lat: -16.408788, lng: -71.537813 }, nombre: '' },
            { coordenadas: { lat: -16.407687, lng: -71.535737 }, nombre: '' },
            { coordenadas: { lat: -16.406086, lng: -71.5337799 }, nombre: '' },
            { coordenadas: { lat: -16.404857, lng: -71.532234 }, nombre: '' },
            { coordenadas: { lat: -16.402557, lng: -71.529376 }, nombre: '' },
            { coordenadas: { lat: -16.404298, lng: -71.527483 }, nombre: '' }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta17'
    },

    Ruta17_Vuelta: {
        solicitud: {
            origin: { lat: -16.404309, lng: -71.527442 },
            destination: { lat: -16.457464, lng: -71.553470 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.407416, lng: -71.531162 }, stopover: true },
                { location: { lat: -16.408926, lng: -71.533070 }, stopover: true },
                { location: { lat: -16.410017, lng: -71.534662 }, stopover: true },
                { location: { lat: -16.407728, lng: -71.538469 }, stopover: true },
                { location: { lat: -16.405731, lng: -71.540153 }, stopover: true },
                { location: { lat: -16.408177, lng: -71.542001 }, stopover: true },
                { location: { lat: -16.418026, lng: -71.550320 }, stopover: true },
                { location: { lat: -16.424247, lng: -71.555700 }, stopover: true },
                { location: { lat: -16.431590, lng: -71.561459 }, stopover: true },
                { location: { lat: -16.435172, lng: -71.562177 }, stopover: true },
                { location: { lat: -16.438269, lng: -71.561032 }, stopover: true },
                { location: { lat: -16.440224, lng: -71.558937 }, stopover: true },
                { location: { lat: -16.443276, lng: -71.555770 }, stopover: true },
                { location: { lat: -16.447824, lng: -71.551574 }, stopover: true },
                { location: { lat: -16.448957, lng: -71.552611 }, stopover: true },
                { location: { lat: -16.449967, lng: -71.553392 }, stopover: true },
                { location: { lat: -16.449742, lng: -71.554078 }, stopover: true },
                { location: { lat: -16.451607, lng: -71.554851 }, stopover: true },
                { location: { lat: -16.454059, lng: -71.551968 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.404298, lng: -71.527483 }, nombre: '' },
            { coordenadas: { lat: -16.407302, lng: -71.531077 }, nombre: '' },
            { coordenadas: { lat: -16.408759, lng: -71.532887 }, nombre: '' },
            { coordenadas: { lat: -16.409945, lng: -71.534394 }, nombre: '' },
            { coordenadas: { lat: -16.409031, lng: -71.537289 }, nombre: '' },
            { coordenadas: { lat: -16.407880, lng: -71.538376 }, nombre: '' },
            { coordenadas: { lat: -16.405765, lng: -71.540001 }, nombre: '' },
            { coordenadas: { lat: -16.408011, lng: -71.541922 }, nombre: '' },
            { coordenadas: { lat: -16.416775, lng: -71.549205 }, nombre: '' },
            { coordenadas: { lat: -16.424112, lng: -71.555641 }, nombre: '' },
            { coordenadas: { lat: -16.431679, lng: -71.561626 }, nombre: '' },
            { coordenadas: { lat: -16.435113, lng: -71.562212 }, nombre: '' },
            { coordenadas: { lat: -16.438143, lng: -71.561196 }, nombre: '' },
            { coordenadas: { lat: -16.440143, lng: -71.559143 }, nombre: '' },
            { coordenadas: { lat: -16.443101, lng: -71.555940 }, nombre: '' },
            { coordenadas: { lat: -16.447744, lng: -71.551620 }, nombre: '' },
            { coordenadas: { lat: -16.448796, lng: -71.552552 }, nombre: '' },
            { coordenadas: { lat: -16.449967, lng: -71.553328 }, nombre: '' },
            { coordenadas: { lat: -16.451293, lng: -71.554598 }, nombre: '' },
            { coordenadas: { lat: -16.453984, lng: -71.552040 }, nombre: '' },
            { coordenadas: { lat: -16.457464, lng: -71.553470 }, nombre: '' }

        ],
        recorrido: 'Vuelta',
        nombre: 'Ruta17'
    },

    Ruta18_Ida: {
        solicitud: {
            origin: { lat: -16.424818, lng: -71.672601 },
            destination: { lat: -16.400118, lng: -71.526278 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.411801, lng: -71.631260 }, stopover: true },
                { location: { lat: -16.407758, lng: -71.607771 }, stopover: true },
                { location: { lat: -16.406660, lng: -71.599669 }, stopover: true },
                { location: { lat: -16.405853, lng: -71.587682 }, stopover: true },
                { location: { lat: -16.404750, lng: -71.573024 }, stopover: true },
                { location: { lat: -16.404443, lng: -71.568150 }, stopover: true },
                { location: { lat: -16.406619, lng: -71.563278 }, stopover: true },
                { location: { lat: -16.411203, lng: -71.556767 }, stopover: true },
                { location: { lat: -16.417527, lng: -71.549722 }, stopover: true },
                { location: { lat: -16.412555, lng: -71.545440 }, stopover: true },
                { location: { lat: -16.408131, lng: -71.541878 }, stopover: true },
                { location: { lat: -16.405825, lng: -71.540082 }, stopover: true },
                { location: { lat: -16.408659, lng: -71.536998 }, stopover: true },
                { location: { lat: -16.406764, lng: -71.534655 }, stopover: true },
                { location: { lat: -16.404804, lng: -71.532240 }, stopover: true },
                { location: { lat: -16.402428, lng: -71.529309 }, stopover: true },
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.424818, lng: -71.672601 }, nombre: '' },
            { coordenadas: { lat: -16.412088, lng: -71.632504 }, nombre: '' },
            { coordenadas: { lat: -16.407951, lng: -71.608429 }, nombre: '' },
            { coordenadas: { lat: -16.406695, lng: -71.600124 }, nombre: '' },
            { coordenadas: { lat: -16.405934, lng: -71.587915 }, nombre: '' },
            { coordenadas: { lat: -16.404796, lng: -71.573517 }, nombre: '' },
            { coordenadas: { lat: -16.404445, lng: -71.568290 }, nombre: '' },
            { coordenadas: { lat: -16.406437, lng: -71.563684 }, nombre: '' },
            { coordenadas: { lat: -16.410773, lng: -71.557252 }, nombre: '' },
            { coordenadas: { lat: -16.417835, lng: -71.549945 }, nombre: '' },
            { coordenadas: { lat: -16.412769, lng: -71.545555 }, nombre: '' },
            { coordenadas: { lat: -16.408253, lng: -71.541921 }, nombre: '' },
            { coordenadas: { lat: -16.405878, lng: -71.540138 }, nombre: '' },
            { coordenadas: { lat: -16.408849, lng: -71.537155 }, nombre: '' },
            { coordenadas: { lat: -16.406880, lng: -71.534738 }, nombre: '' },
            { coordenadas: { lat: -16.404960, lng: -71.532303 }, nombre: '' },
            { coordenadas: { lat: -16.402629, lng: -71.529443 }, nombre: '' },
            { coordenadas: { lat: -16.400118, lng: -71.526278 }, nombre: '' }
        ],
        recorrido: 'Ida',
        nombre: 'Ruta18'
    },

    Ruta18_Vuelta: {
        solicitud: {
            origin: { lat: -16.400118, lng: -71.526278 },
            destination: { lat: -16.424818, lng: -71.672601 },
            travelMode: 'DRIVING',
            waypoints: [
                { location: { lat: -16.401924, lng: -71.524605 }, stopover: true },
                { location: { lat: -16.404934, lng: -71.528158 }, stopover: true },
                { location: { lat: -16.407030, lng: -71.530675 }, stopover: true },
                { location: { lat: -16.408839, lng: -71.532947 }, stopover: true },
                { location: { lat: -16.409459, lng: -71.536415 }, stopover: true },
                { location: { lat: -16.408901, lng: -71.537493 }, stopover: true },
                { location: { lat: -16.407485, lng: -71.538699 }, stopover: true },
                { location: { lat: -16.405720, lng: -71.540101 }, stopover: true },
                { location: { lat: -16.408565, lng: -71.542331 }, stopover: true },
                { location: { lat: -16.412811, lng: -71.545503 }, stopover: true },
                { location: { lat: -16.415304, lng: -71.542419 }, stopover: true },
                { location: { lat: -16.419299, lng: -71.543814 }, stopover: true },
                { location: { lat: -16.418096, lng: -71.548797 }, stopover: true },
                { location: { lat: -16.411085, lng: -71.556453 }, stopover: true },
                { location: { lat: -16.406161, lng: -71.563632 }, stopover: true },
                { location: { lat: -16.404140, lng: -71.568424 }, stopover: true },
                { location: { lat: -16.404464, lng: -71.573469 }, stopover: true },
                { location: { lat: -16.405775, lng: -71.589039 }, stopover: true },
                { location: { lat: -16.406692, lng: -71.600331 }, stopover: true },
                { location: { lat: -16.407912, lng: -71.608588 }, stopover: true },
                { location: { lat: -16.412054, lng: -71.632636 }, stopover: true }
            ]
        },
        paradas: [
            { coordenadas: { lat: -16.400118, lng: -71.526278 }, nombre: '' },
            { coordenadas: { lat: -16.401924, lng: -71.524605 }, nombre: '' },
            { coordenadas: { lat: -16.404779, lng: -71.528059 }, nombre: '' },
            { coordenadas: { lat: -16.406833, lng: -71.530515 }, nombre: '' },
            { coordenadas: { lat: -16.408721, lng: -71.532890 }, nombre: '' },
            { coordenadas: { lat: -16.408973, lng: -71.537310 }, nombre: '' },
            { coordenadas: { lat: -16.407595, lng: -71.538597 }, nombre: '' },
            { coordenadas: { lat: -16.405720, lng: -71.540101 }, nombre: '' },
            { coordenadas: { lat: -16.408170, lng: -71.542015 }, nombre: '' },
            { coordenadas: { lat: -16.412778, lng: -71.545521 }, nombre: '' },
            { coordenadas: { lat: -16.415272, lng: -71.542435 }, nombre: '' },
            { coordenadas: { lat: -16.419220, lng: -71.543721 }, nombre: '' },
            { coordenadas: { lat: -16.418218, lng: -71.548446 }, nombre: '' },
            { coordenadas: { lat: -16.411204, lng: -71.556279 }, nombre: '' },
            { coordenadas: { lat: -16.406368, lng: -71.563135 }, nombre: '' },
            { coordenadas: { lat: -16.404111, lng: -71.568179 }, nombre: '' },
            { coordenadas: { lat: -16.404428, lng: -71.573264 }, nombre: '' },
            { coordenadas: { lat: -16.405620, lng: -71.588551 }, nombre: '' },
            { coordenadas: { lat: -16.406624, lng: -71.599973 }, nombre: '' },
            { coordenadas: { lat: -16.407802, lng: -71.608172 }, nombre: '' },
            { coordenadas: { lat: -16.411978, lng: -71.632483 }, nombre: '' },
            { coordenadas: { lat: -16.424818, lng: -71.672601 }, nombre: '' },
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
        suppressMarkers: true
    });
    renderizador.setMap(mapa);
    servicioDirecciones.route(solicitud, function (resultado, estado) {
        if (estado === 'OK') {
            renderizador.setDirections(resultado);
            paradasAutobus.forEach(function (parada) {
                var marcador = createMarker(parada.coordenadas, color);
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

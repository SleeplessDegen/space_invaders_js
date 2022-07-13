
export function ServiceWorkerAktiv(){
    console.log(navigator);
    if('serviceWorker' in navigator){
        // Serviceworker registrieren
        navigator.serviceWorker.register('./service-worker.js', {scope:'./'})
        .then(()=>{
            console.log('Service Worker erfolgreich registriert')
        })
        .catch((error) => {console.log(error, 'uups')})
    }
}
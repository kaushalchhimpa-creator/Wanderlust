// Backup location (Delhi) agar coordinates na milein toh
const mapCenter = (typeof coordinates !== 'undefined' && Array.isArray(coordinates) && coordinates.length === 2) 
    ? coordinates 
    : [77.209, 28.6139];

const map = new maplibregl.Map({
    container: "map", 
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    center: mapCenter, 
    zoom: 9
});

// Map par Red Marker pin aur Popup lagane ke liye
if (typeof coordinates !== 'undefined' && Array.isArray(coordinates) && coordinates.length === 2) {
    
    // 1. Pehle Popup ka HTML aur design create karein
    const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
            <h4 style="margin: 0 0 5px 0; font-family: sans-serif; color: #333;">Listing Location</h4>
            <p style="margin: 0; font-family: sans-serif; color: #666; font-size: 13px;">Exact location will be provided after booking</p>
        `);

    // 2. Marker create karein aur usme popup ko attach kar dein
    new maplibregl.Marker({ color: "red" })
        .setLngLat(coordinates)
        .setPopup(popup) // Ye line popup ko marker ke sath jod degi
        .addTo(map);

} else {
    console.log("Purani listing hai ya coordinates nahi mile.");
}
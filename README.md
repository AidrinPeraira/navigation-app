# About this project

- This is a next js project to understand the use of map box api.
- This is a general flow demonstration and a guide to implement map box in projects.
- Next JS has been used only to prevent creating a seperate backend server. All functionality is designed for the ui as if being used by purely react using client side components alone.

# Step 1: Create place holder components for the UI as needed.

    - This project has the following components that are all together rendered in the page.tsx file.
        - Floating Card: The container in which the whole map ui is brought together
        - GPS Button: To center the user's map to the current location
        - Map Container: The element that rendedrs the map tile images from MapBox
        - Navigation Shell: Container for the search box and saved routes list and side bar to add and remove stops before navigation start
        - Route Sidebar: For adding and removing stops before navigation starts
        - Saved ROutes Drop Down - To add a whole route to be used later (Saving locations should work similarly. This projects allows saving entire routes only)
        - Search Bar: Obviously! :)
        - Place Side Bar: Sow details about locatoin selected

# Step 2: Create a custom hook for the map instance in the client

    - Map box works using a instance created from the package ("mapbox-gl"). This instance is used to render the map in Map Container. Any change is done using this instance created.
    - Create a custom hook to create a reusable map instance which follows the singleton pattern to initalise the instance for mapbox.
    - This hook is used to create the instance and a context provider for every component that needs the map feature.

    - This is done in the components map-context.tsx and map-provider.tsx. the provider is wraped in the floating card component

# Sowing the user's current location marker

    - add the css import to layout
        - import "mapbox-gl/dist/mapbox-gl.css";
    - create a new instance for "control = new mapboxgl.GeolocateControl({config})" from the mapbox-gl package
    - set it as a control to the map instance. "map.addControl(control)"
    - map box controls this by default
    - to not show the default center map icon by map box add the following in globals.css

            .mapboxgl-ctrl-geolocate {
                display: none !important;
            }

# Handling Searching for a place via search bar

    - send a request with the search query in a the right format with public key in the url as given in the documentation
    - the query is set by search bar.
    - navigation shell reads it and makes api request to route.ts
    - it then renders the right component
    - two types of submit: 1. Select from suggestions, 2. Enter to show closest


    - WE STORE THE MARKER DATA ALSO IN THE STATE TO MAKE IT AVAILABLE TO ALL COMPONENTS

# Handling the routing

    - when a place is selected and we click directions we get directions from current location to the selected as a path
    - we add this to the context. so that all components can access it
    - we take the current location from the navigation web api. and use that to find routes between current location and selected location
    - we add the routes to contex
    - we render the routes using the map instance and add an onclick listener to the route lines to handle route selection

# Handling adding stops

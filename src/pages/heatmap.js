import React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../App.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerHighlight from "../assets/marker-highlight.png";
import { Icon } from 'leaflet'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Button, Grid, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import Typography from '@mui/material/Typography';

function Heatmap() {

    const [params, setParams] = useSearchParams();
    const DEFAULT = [37.8719, -122.2585];
    let initial = params.get('lon') && params.get('lat') ? [params.get('lon'), params.get('lat')] : DEFAULT;
    const [userSelect, setUserSelect] = useState('');
    const [strengthStr, setStrengthStr] = useState('');
    const [current, setCurrent] = useState(initial);
    const uuid = params.get('uuid') ? params.get('uuid') : 'Anonymous';
    let initialized = false;
    const [inputs, setInputs] = useState({});
    const [report, setReport] = useState();
    const [defaultWarning, setDefaultWarning] = useState(false);
    const URL = process.env.REACT_APP_API_URL;

    async function getInputs() {
        await fetch(`${URL}/get-users`, {
            method: 'GET',
            headers: {
                'Access-Control-Allow-Origin': '*',
              },
        })
            .then(response => response.json())
            .then(data => {
                let received = {};
                for (let entry of data.results) {
                    received[entry.location] =  entry.rating;
                }
                setInputs(received);
            })
    }

    useEffect(() => {
        if (Object.keys(inputs).length === 0) {
            console.log("No input detected. Fetching inputs...");
            getInputs();
        }
        else {
            console.log("Current Inputs:", inputs);
        }
    }, [])

    const coords = {
        "Default": DEFAULT,
        "Sather Gate": [37.8703, -122.2595],
        "ASUC Student Union": [37.8692, -122.2597],
        "Moffitt Library": [37.8725, -122.2608],
        "Doe Library": [37.8722, -122.2592],
        "East Asian Library": [37.8736, -122.2600],
        "Kresge Engineering Library": [37.8738, -122.2583],
        "Haas Courtyard": [37.8716, -122.2533],
    }

    const strengths = {
        "Good": 1,
        "Unstable": 2,
        "Down": 3,
    }

    async function submitReport() {
        let loc = report[0];
        if (loc === "") {
            loc = "Default";
        }
        await fetch(`${URL}/add-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                location: loc,
                rating: report[1],
            })
        })
    }

    //Theme Configuration
    const theme = createTheme({
        palette: {
            primary: {
                main: '#28B5E2',
            },
            neutral: {
                main: '#FFFFFF',
                contrastText: '#4EB0F3',
            },
            warning: {
                main: '#FF5D5D',
            }
        },
    });

    function BerkeleyMarker(props) {
        return (
            <Marker position={props.pos} icon={
                new Icon({
                    iconUrl: props.pos === current ? markerHighlight : markerIconPng,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            }>
                <Popup>
                    {props.desc}
                </Popup>
            </Marker>
        )
    }

    //Fetch geolocation from query string
    useEffect(() => {
        if (!initialized && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                initial = [position.coords.latitude, position.coords.longitude];
                initialized = true;
            });
        };
    }, [])

    useEffect(() => {
        if (current.toString() == DEFAULT.toString()) {
            setDefaultWarning(true);
        } else {
            setDefaultWarning(false);
        }
    }, [current])

    function BuildingZone(props) {
        const colors = {
            NA: "#FFFFFF00",
            Light: '#84F46D',
            Medium: '#F4CE6D',
            Heavy: '#F94F38',
        }

        let color = ["#FFFFFF00", colors['NA']];

        const name = props.name;

        if (inputs[name] > 0) {
            color[0] = "#FFFFFF";
            if (inputs[name] <= 1) {
                color[1] = colors['Light'];
            } else if (inputs[name] <= 2) {
                color[1] = colors['Medium'];
            } else {
                color[1] = colors['Heavy'];
            }
        }

        return (
            <Circle center={coords[name]} key={name} color={color[0]} fillColor={color[1]} fillOpacity={0.65} radius={30} />
        )
    }

    function BerkeleyMap(props) {
        return (
            <div className="leaflet-container">
                <MapContainer center={props.current} zoom={17} scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <BerkeleyMarker pos={coords['Sather Gate']} desc='Sather Gate' />
                    <BerkeleyMarker pos={coords['ASUC Student Union']} desc='ASUC Student Union (MLK Jr. Building)' />
                    <BerkeleyMarker pos={coords['Moffitt Library']} desc='Moffitt Library' />
                    <BerkeleyMarker pos={coords['Doe Library']} desc='Doe Library' />
                    <BerkeleyMarker pos={coords['East Asian Library']} desc='East Asian Library' />
                    <BerkeleyMarker pos={coords['Kresge Engineering Library']} desc='Kresge Library' />
                    <BerkeleyMarker pos={coords['Haas Courtyard']} desc='Haas School of Business' />
                    <BerkeleyMarker pos={props.current} desc={'Current User'} />

                    {Object.entries(inputs).map(([building, value], i) => <BuildingZone name={building} />)}

                </MapContainer>
            </div>
        )
    }

    return (
        <>
            <ThemeProvider theme={theme}>
                <div className="page">
                    <BerkeleyMap current={current}></BerkeleyMap>
                    <Grid container spacing={5}>
                        <Grid item xs={4}>
                            <Typography variant="h6" style={{ marginBottom: "5px" }}>Where are you located?</Typography>
                            <FormControl fullWidth style={{ marginBottom: "20px" }}>
                                <InputLabel>Select Current Location</InputLabel>
                                <Select
                                    id="location"
                                    value={userSelect}
                                    label='Select Current Location'
                                    onChange={event => {
                                        setUserSelect(event.target.value);
                                        setCurrent(coords[event.target.value]);
                                        console.log(coords[event.target.value]);
                                        setParams(params);
                                    }}
                                >
                                    <MenuItem value="ASUC Student Union">ASUC Student Union (MLK Jr. Building)</MenuItem>
                                    <MenuItem value="Doe Library">Doe Library</MenuItem>
                                    <MenuItem value="East Asian Library">East Asian Library</MenuItem>
                                    <MenuItem value="Haas Courtyard">Haas Courtyard</MenuItem>
                                    <MenuItem value="Kresge Engineering Library">Kresge Engineering Library</MenuItem>
                                    <MenuItem value="Moffitt Library">Moffitt Library</MenuItem>
                                    <MenuItem value="Sather Gate">Sather Gate</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                color="neutral"
                                onClick={() => {
                                    setUserSelect('');
                                    setCurrent(DEFAULT);
                                }}
                            >Reset Location</Button>
                            <Button
                                variant="contained"
                                color="neutral"
                                style={{ marginLeft: "1rem" }}
                                onClick={() => {
                                    window.location.reload();
                            }}
                            >Refresh</Button>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography variant="h6">How is the campus WiFi at your current location?</Typography>
                            <FormControl fullWidth style={{ marginTop: "5px", marginBottom: "20px" }}>
                                <InputLabel>Select your response</InputLabel>
                                <Select
                                    id="location"
                                    value={strengthStr}
                                    label='Select your response'
                                    onChange={event => {
                                        if (!defaultWarning) {
                                            setStrengthStr(event.target.value)
                                            setReport([userSelect, strengths[event.target.value]]);
                                            setParams(params);
                                            console.log([userSelect, strengths[event.target.value]]);
                                        }
                                    }}
                                >
                                    <MenuItem value="Good">Good</MenuItem>
                                    <MenuItem value="Unstable">Unstable</MenuItem>
                                    <MenuItem value="Down">Down</MenuItem>
                                </Select>
                            </FormControl>
                            <div style={{ marginBottom: '10px' }}>
                                <span>
                                    <Button
                                        variant="contained"
                                        color="neutral"
                                        onClick={submitReport}
                                        className="actionButton">Submit Feedback</Button>
                                    <Button
                                        variant="contained"
                                        color="neutral"
                                        onClick={() => {
                                            setCurrent(DEFAULT);
                                            setUserSelect('');
                                            setStrengthStr('');
                                        }}
                                        style={{ marginLeft: "1rem" }}
                                        className="actionButton">Clear Response</Button>
                                </span>
                            </div>
                            {defaultWarning ? <Typography variant="p" style={{ marginTop: "5px" }} color="warning">Please select your current location first.</Typography> : <></>}
                        </Grid>
                    </Grid>
                </div>
            </ThemeProvider>
        </>
    );
}

export default Heatmap;
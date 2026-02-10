import './App.css';
import MapChart from './MapChart';

function App(): React.ReactElement {
  return (
    <div className="App">
      <div className="map-container">
        <MapChart/>
      </div>
    </div>
  );
}

export default App;

import * as React from 'react';
import ScenarioListDropDownMenu from './scenario-list-drop-down-menu';
import { RootProps } from './root';
import KeyboardHelp from './keyboard-help';

export const MAX_DELAY_MS = 1000;

/** A simple interface for the vehicle counts we care about. */
interface VehicleCounts {
  passenger: number;
  truck: number;
  bicycle: number;
  motorcycle: number;
  bus: number;
  pedestrian: number;
}

/** We store:  
 *  1) `sliderLocation` for the speed slider,  
 *  2) `prevCounts` for comparing old vs. new,  
 *  3) `arrowDirections` indicating up/down for each vehicle class.
 */
interface SidebarState {
  sliderLocation: number;
  prevCounts: VehicleCounts;
  arrowDirections: {
    passenger: string; // 'up' | 'down' | null
    truck: string;
    bicycle: string;
    motorcycle: string;
    bus: string;
    pedestrian: string;
  };
}

/** A button that toggles between Pause and Resume based on `simulationStatus`. */
function PauseOrResume(props: RootProps) {
  if (props.simulationStatus === 'running') {
    return (
      <button
        onClick={props.onPause}
        className="px-2 py-1 text-sm font-medium bg-white border border-black text-black rounded hover:bg-gray-100"
      >
        Pause
      </button>
    );
  } else if (props.simulationStatus === 'paused') {
    return (
      <button
        onClick={props.onResume}
        className="px-2 py-1 text-sm font-medium bg-black text-white rounded hover:bg-gray-800"
      >
        Resume
      </button>
    );
  }
  return null;
}

/** Green arrow SVG (indicating the count went up). */
function ArrowUpSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 256 256"
      style={{ display: 'inline-block', marginLeft: 4 }}
    >
      <g transform="translate(1.4 1.4) scale(2.8 2.8)">
        <path
          d="M43.779 0.434L12.722 25.685c-0.452 0.368-0.714 0.92-0.714 1.502v19.521c0 0.747 0.43 1.427 1.104 1.748 0.674 0.321 1.473 0.225 2.053-0.246L45 23.951l29.836 24.258c0.579 0.471 1.378 0.567 2.053 0.246 0.674-0.321 1.104-1.001 1.104-1.748V27.187c0-0.582-0.263-1.134-0.714-1.502L46.221 0.434c-0.711-0.579-1.731-0.579-2.442 0z"
          fill="#45d856"
        />
        <path
          d="M43.779 41.792l-31.057 25.25c-0.452 0.368-0.714 0.919-0.714 1.502v19.52c0 0.747 0.43 1.427 1.104 1.748 0.674 0.321 1.473 0.225 2.053-0.246L45 65.308l29.836 24.258c0.579 0.471 1.378 0.567 2.053 0.246 0.674-0.321 1.104-1.001 1.104-1.748V68.544c0-0.583-0.263-1.134-0.714-1.502l-31.057-25.25c-0.711-0.578-1.731-0.578-2.442 0z"
          fill="#45d856"
        />
      </g>
    </svg>
  );
}

/** Red arrow SVG (indicating the count went down). */
function ArrowDownSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 256 256"
      style={{ display: 'inline-block', marginLeft: 4 }}
    >
      <g transform="translate(1.4 1.4) scale(2.8 2.8)">
        <path
          d="M43.779 89.566L12.722 64.315c-0.452-0.368-0.714-0.92-0.714-1.502V43.293c0-0.747 0.43-1.427 1.104-1.748 0.674-0.321 1.473-0.225 2.053 0.246L45 66.049l29.836-24.258c0.579-0.471 1.378-0.567 2.053-0.246 0.674 0.321 1.104 1.001 1.104 1.748v19.521c0 0.582-0.263 1.134-0.714 1.502L46.221 89.566c-0.711 0.579-1.731 0.579-2.442 0z"
          fill="#ce3e3e"
        />
        <path
          d="M43.779 48.208l-31.057-25.25c-0.452-0.368-0.714-0.919-0.714-1.502V1.936c0-0.747 0.43-1.427 1.104-1.748 0.674-0.321 1.473-0.225 2.053 0.246L45 24.692 74.836 0.434c0.579-0.471 1.378-0.567 2.053-0.246 0.674 0.321 1.104 1.001 1.104 1.748v19.521c0 0.583-0.263 1.134-0.714 1.502l-31.057 25.25c-0.711 0.578-1.731 0.578-2.442 0z"
          fill="#ce3e3e"
        />
      </g>
    </svg>
  );
}

/** Compare two numeric counts, returning 'up', 'down', or '' if unchanged. */
function compareCounts(oldVal: number, newVal: number): string {
  if (newVal > oldVal) return 'up';
  if (newVal < oldVal) return 'down';
  return '';
}

/** Render the appropriate arrow (or none) based on the direction string. */
function renderArrow(direction: string) {
  if (direction === 'up') {
    return <ArrowUpSvg />;
  } else if (direction === 'down') {
    return <ArrowDownSvg />;
  }
  return null;
}

class Sidebar extends React.Component<RootProps, SidebarState> {
  constructor(props: RootProps) {
    super(props);

    // Convert delayMs -> slider value, where 1 == slow, 0 == fast.
    const initialSlider = 1 - props.delayMs / MAX_DELAY_MS;

    // Safely get initial counts (fallback to 0 if missing).
    let initialPassenger = 0;
    let initialTruck = 0;
    let initialBicycle = 0;
    let initialMotorcycle = 0;
    let initialBus = 0;
    let initialPedestrian = 0;

    if (props.stats && props.stats.vehicleCounts) {
      initialPassenger = props.stats.vehicleCounts.passenger || 0;
      initialTruck = props.stats.vehicleCounts.truck || 0;
      initialBicycle = props.stats.vehicleCounts.bicycle || 0;
      initialMotorcycle = props.stats.vehicleCounts.motorcycle || 0;
      initialBus = props.stats.vehicleCounts.bus || 0;
      initialPedestrian = props.stats.vehicleCounts.pedestrian || 0;
    }

    this.state = {
      sliderLocation: initialSlider,

      // Remember the "previous" counts so we can see if they go up or down next time.
      prevCounts: {
        passenger: initialPassenger,
        truck: initialTruck,
        bicycle: initialBicycle,
        motorcycle: initialMotorcycle,
        bus: initialBus,
        pedestrian: initialPedestrian,
      },

      // The arrow directions for each vehicle type.
      arrowDirections: {
        passenger: '',
        truck: '',
        bicycle: '',
        motorcycle: '',
        bus: '',
        pedestrian: '',
      },
    };
  }

  /** Compare old vs. new counts any time we get new props. */
  componentDidUpdate(prevProps: RootProps) {
    const oldStats = prevProps.stats;
    const newStats = this.props.stats;

    // If we don't have old/new stats or they're the same object, do nothing.
    if (!oldStats || !newStats) return;
    if (oldStats === newStats) return;

    const oldCounts = oldStats.vehicleCounts;
    const newCounts = newStats.vehicleCounts;
    if (!oldCounts || !newCounts) return;

    // We'll compute new arrow directions by comparing each field.
    const arrowDirections = Object.assign({}, this.state.arrowDirections);

    arrowDirections.passenger = compareCounts(
      oldCounts.passenger || 0,
      newCounts.passenger || 0
    );
    arrowDirections.truck = compareCounts(
      oldCounts.truck || 0,
      newCounts.truck || 0
    );
    arrowDirections.bicycle = compareCounts(
      oldCounts.bicycle || 0,
      newCounts.bicycle || 0
    );
    arrowDirections.motorcycle = compareCounts(
      oldCounts.motorcycle || 0,
      newCounts.motorcycle || 0
    );
    arrowDirections.bus = compareCounts(oldCounts.bus || 0, newCounts.bus || 0);
    arrowDirections.pedestrian = compareCounts(
      oldCounts.pedestrian || 0,
      newCounts.pedestrian || 0
    );

    // Update prevCounts to the newest values so we compare correctly next time.
    this.setState({
      arrowDirections: arrowDirections,
      prevCounts: {
        passenger: newCounts.passenger || 0,
        truck: newCounts.truck || 0,
        bicycle: newCounts.bicycle || 0,
        motorcycle: newCounts.motorcycle || 0,
        bus: newCounts.bus || 0,
        pedestrian: newCounts.pedestrian || 0,
      },
    });
  }

  /** Called when the user stops dragging the slider. */
  handleSliderStop = () => {
    const delayMs = (1 - this.state.sliderLocation) * MAX_DELAY_MS;
    this.props.onChangeDelayMs(delayMs);
  };

  /** Called whenever the slider moves. */
  handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    this.setState({ sliderLocation: newVal });
  };

  render() {
    const { simulationStatus, onStart, onCancel, isLoading, stats } = this.props;

    // Fallback to zero if these fields are missing.
    let passengerCount = 0;
    let truckCount = 0;
    let bicycleCount = 0;
    let motorcycleCount = 0;
    let busCount = 0;
    let pedestrianCount = 0;

    if (stats && stats.vehicleCounts) {
      passengerCount = stats.vehicleCounts.passenger || 0;
      truckCount = stats.vehicleCounts.truck || 0;
      bicycleCount = stats.vehicleCounts.bicycle || 0;
      motorcycleCount = stats.vehicleCounts.motorcycle || 0;
      busCount = stats.vehicleCounts.bus || 0;
      pedestrianCount = stats.vehicleCounts.pedestrian || 0;
    }

    // Calculate black->gray gradient for slider background.
    const sliderPercentage = this.state.sliderLocation * 100;
    const sliderBackground = {
      background:
        'linear-gradient(to right,' +
        ' black 0%,' +
        ' black ' +
        sliderPercentage +
        '%,' +
        ' #e5e7eb ' +
        sliderPercentage +
        '%,' +
        ' #e5e7eb 100%)',
    };

    // Display a numeric delay in ms.
    const delayMs = ((1 - this.state.sliderLocation) * MAX_DELAY_MS).toFixed(1);

    // For arrows:
    const dirs = this.state.arrowDirections;

    return (
      <div
        className="fixed top-0 left-0 m-2 max-w-xs p-2 bg-white border border-gray-200 rounded shadow-sm text-black z-50"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Main Title */}
        <h2 className="text-xl font-bold mb-3">Control Panel</h2>

        {/* Scenario Controls */}
        <div className="mb-4">
          <h3 className="text-base font-semibold mb-2">Scenario Controls</h3>

          {/* Scenario dropdown */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Current Scenario:</span>
            <ScenarioListDropDownMenu {...this.props} />
          </div>

          {/* Start/Cancel, Pause/Resume */}
          <div className="flex flex-wrap items-center gap-2">
            {simulationStatus === 'off' ? (
              <button
                onClick={onStart}
                disabled={isLoading}
                className="px-2 py-1 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
              >
                Start
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="px-2 py-1 text-sm font-medium bg-black border border-black text-white rounded disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            {simulationStatus !== 'off' && <PauseOrResume {...this.props} />}
          </div>

          <div className="flex justify-center mt-2">
            <KeyboardHelp {...this.props} />
          </div>
        </div>

        {/* Simulation Speed */}
        <div className="mb-4">
          <h3 className="text-base font-semibold mb-2">Simulation Speed</h3>
          <div className="flex justify-between text-xs mb-1">
            <span>slow</span>
            <span>fast</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.99"
            step="0.01"
            value={this.state.sliderLocation}
            onChange={this.handleSliderChange}
            onMouseUp={this.handleSliderStop}
            onTouchEnd={this.handleSliderStop}
            className="w-full h-2 appearance-none rounded-full outline-none cursor-pointer"
            style={sliderBackground}
          />
          <div className="mt-1 text-sm font-medium">Delay: {delayMs} ms</div>
        </div>

        {/* Vehicle Summary */}
        <div>
          <h3 className="text-base font-semibold mb-2">Vehicle Summary</h3>
          <ul className="text-sm space-y-1">
            <li>
              Cars: {passengerCount}
              {renderArrow(dirs.passenger)}
            </li>
            <li>
              Trucks: {truckCount}
              {renderArrow(dirs.truck)}
            </li>
            <li>
              Bikes: {bicycleCount}
              {renderArrow(dirs.bicycle)}
            </li>
            <li>
              Motorcycles: {motorcycleCount}
              {renderArrow(dirs.motorcycle)}
            </li>
            <li>
              Buses: {busCount}
              {renderArrow(dirs.bus)}
            </li>
            <li>
              Persons: {pedestrianCount}
              {renderArrow(dirs.pedestrian)}
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default Sidebar;

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';

import util from "../../comms/util/util";
import DeviceStore from '../../stores/DeviceStore';
import DeviceActions from '../../actions/DeviceActions';
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';
import MeasureStore from '../../stores/MeasureStore';
import MeasureActions from '../../actions/MeasureActions';

import { PageHeader } from "../../containers/full/PageHeader";
import Filter from "../utils/Filter";

import AltContainer from 'alt-container';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'

import { Line } from 'react-chartjs-2';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';

function TagList (props) {
  const tags = props.tags;
  return (
    <span>
      { (tags.length > 0) ? (
        tags.map((tag) =>
          <span className="tag" key={tag}>
            <i className="fa fa-tag"></i>{tag}
          </span>
        )
      ) : (
        <sapn className="tag">No tags set</sapn>
      )}
    </span>
  )
}

class DeviceTag extends Component {
  constructor(props) {
    super(props);

    this.handleRemove = this.handleRemove.bind(this);
  }

  handleRemove(e) {
    this.props.removeTag(this.props.tag);
  }

  render() {
    return (
      <div key={this.props.tag}>
        {this.props.tag} &nbsp;
        <a title="Remove tag" className="btn-item" onClick={this.handleRemove}>
          <i className="fa fa-times" aria-hidden="true"></i>
        </a>
      </div>
    )
  }
}

function SummaryItem(props) {
  let status = "disabled";
  if (props.device.status) {
    status = "online";
  } else {
    if (('enabled' in props.device) && props.device.enabled) {
      status = "offline";
    }
  }

  return (
    <div className={"clickable lst-entry-wrapper z-depth-2 col s12 " + status}>
      <div className="lst-entry-title col s12">
        <div className="img">
          <img src="images/ciShadow.svg" />
        </div>
        <div className="user-label">{props.device.label}</div>
        <div className="label">device name</div>
        <span className={"badge " + status}>{status}</span>
      </div>

      <div className="lst-entry-body col s12">
        {/* TODO fill those with actual metrics */}
        <div className="col s3 metric">
          <div className="metric-value">{props.device.attrs.length + props.device.static_attrs.length}</div>
          <div className="metric-label">Attributes</div>
        </div>
        <div className="col s9 metric last">
          <div className="metric-value">{util.printTime(props.device.updated)}</div>
          <div className="metric-label">Last update</div>
        </div>
      </div>
    </div>
  )
}

class Graph extends Component{
  constructor(props) {
    super(props);
  }

  render() {
    let labels = [];
    let values = [];
    this.props.data.map((i) => {
      labels.push(i.recvTime);

      if (i.attrType.toLowerCase() === 'integer') {
        values.push(parseInt(i.attrValue));
      } else if (i.attrType.toLowerCase() === 'float') {
        values.push(parseFloat(i.attrValue));
      } else {
        console.error('unknown field type');
        values.push(parseInt(i.attrValue));
      }


    })

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Device data',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: values
        }
      ]
    }

    const options = {
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{ display: false }]
      }
    }

    return (
      <Line data={data} options={options}/>
    )
  }
}

class PositionRenderer extends Component {
  componentDidMount(){}

  render() {
    const position = [-22.8132384,-47.0448855];
    return (
      <Map center={position} zoom={19}>
        <TileLayer
          url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}></Marker>
      </Map>
    )
  }
}

function Position(props) {
  if (props.position == null) {
    // render not available message
    return (
      <div className="full-height valign-wrapper background-info subtle relative graph">
        <div className="horizontal-center">
          <i className="material-icons">report_problem</i>
          <div>No position data available</div>
        </div>
      </div>
    )
  }

  return (
    <AltContainer store={MeasureStore}>
      <PositionRenderer />
    </AltContainer>
  )
}

class DetailAttrs extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.device.attrs.map((i) => {
      MeasureActions.fetchMeasures.defer(this.props.device.id, i.name)
    })
  }

  render() {
    const device = this.props.device;

    let count = 0;
    if (device.static_attrs.length > 0) { count++; }
    count += device.attrs.length;
    count = count % 4;

    let horizontalSize = "col s4";
    if (count == 2 && device.static_attrs.length > 0) {
      horizontalSize = "col s8";
    } else if (count != 0) {
      horizontalSize = "col s" + (12 / count);
    }

    function AttrList(props) {
      return (
        <span>
          { device.attrs.map((i, k) =>
            (k < count) && (
              <div className={horizontalSize + " metric-card full-height"} key={i.object_id} >
                {(props.devices[device.id] && props.devices[device.id][i.name] &&
                  (props.devices[device.id][i.name].loading == false)) ? (
                  <div className="graph z-depth-2 full-height">
                    <div className="title row">
                      <span>{i.name}</span>
                      <span className="right"
                            onClick={() => MeasureActions.fetchMeasures(device.id, i.name)}>
                        <i className="fa fa-refresh" />
                      </span>
                    </div>
                    <div className="contents"><Graph data={props.devices[device.id][i.name].data}/></div>
                  </div>
                ) : (
                  <div className="graph z-depth-2 full-height">
                    <span className="title">{i.name}</span>
                    <div className="contents">
                      <div className="background-info valign-wrapper full-height relative bg-gray">
                        <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </span>
      )
    }

    if (device.static_attrs.length > 0) {
      count--;
      return (
        <div className="row half-height">
          <div className="col s4 full-height">
            <div className="text-info full-height">
              <div className="title">Attributes</div>
              <div className="">
                <ul>
                  {device.static_attrs.map((i, k) =>
                    (k < 3) && (
                      <li key={i.name}>
                        <span className="col s6 label">{i.name}</span>
                        <span className="col s6 value">{i.value}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>

          <AttrList devices={this.props.devices} />
        </div>
      )
    } else {
      return (
        <div className="row half-height">
          <AttrList devices={this.props.devices} />
        </div>
      )
    }
  }
}

class DetailItem extends Component {
  constructor(props) {
    super(props);
    this.remove = this.remove.bind(this);
  }

  remove(e) {
    e.preventDefault();
    DeviceActions.triggerRemoval(this.props.device);
    this.props.handleDismiss();
  }

  render() {
    let status = "disabled";
    if (this.props.device.status) {
      status = "online";
    } else {
      if (('enabled' in this.props.device) && this.props.device.enabled) {
        status = "offline";
      }
    }

    let position = null;
    function getPosition(i) {
      if (i.type == "geo") {
        position = i;
      }
    }
    this.props.device.attrs.map((i) => {getPosition(i)})
    if (position === null) {
      this.props.device.static_attrs.map((i) => {getPosition(i)})
    }

    return (
      <div className={"lst-entry-wrapper z-depth-2 col s12 " + status}>

        <div className="row detail-header">
          <div className="title">
            <div className="label">{this.props.device.label}</div>
            <div className="id">ID {this.props.device.id}</div>
          </div>
          <div className="actions">
            <div><i className="clickable fa fa-code" /></div>
            <div><i className="clickable fa fa-expand" /></div>
            <Link to={"/device/id/" + this.props.device.id + "/edit"} >
              <div><i className="clickable fa fa-pencil" /></div>
            </Link>
            <div><i className="clickable fa fa-trash" onClick={this.remove}/></div>
            <div><i className="clickable fa fa-times" onClick={this.props.handleDismiss}/></div>
          </div>
          <div className="status">{status}</div>
        </div>

        <div className="row detail-body">
          <div className="row content">
            <div className="col s9 full-height">
              <div className="row half-height">
                <div className="col s3 full-height">
                  <div className="img full-height">
                    <img src="images/ciShadow.svg" />
                  </div>
                </div>
                <div className="col s9">
                  <div className="metrics col s12">
                    <div className="metric col s4">
                      <span className="label">Attributes</span>
                      <span className="value">{this.props.device.attrs.length + this.props.device.static_attrs.length}</span>
                      {/* <span className="value">{this.props.device.attrs.length}</span> */}
                    </div>
                    <div className="metric col s4">
                      <span className="label">Last update</span>
                      <span className="value">{util.printTime(this.props.device.updated)}</span>
                    </div>
                    <div className="metric col s4">
                      <span className="label">Uptime</span>
                      <span className="value">N/A</span>
                    </div>
                  </div>

                  <div className="metrics col s12">
                    <div className="metric col s4" >
                      <span className="label">Protocol</span>
                      <span className="value">{this.props.device.protocol ? this.props.device.protocol : "MQTT"}</span>
                    </div>
                    <div className="metric col s8" >
                      <span className="label">Tags</span>
                      <TagList tags={this.props.device.tags} />
                    </div>
                  </div>
                </div>
              </div>
              <AltContainer store={MeasureStore} inject={{device: this.props.device}} >
                <DetailAttrs />
              </AltContainer>
            </div>
            <div className="col s3 map z-depth-2 full-height">
              <Position position={position} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class ListItem extends Component {
  constructor(props) {
    super(props);

    this.handleDetail = this.handleDetail.bind(this);
    this.handleDismiss = this.handleDismiss.bind(this);
  }

  handleDetail(e) {
    e.preventDefault();
    this.props.setDetail(this.props.device.id);
  }

  handleDismiss(e) {
    if (e) {
      e.preventDefault();
    }
    this.props.setDetail(null);
  }

  render() {
    const detail = this.props.detail

    if (detail) {
      return (
        <div className="lst-entry col s12 detail" id={this.props.device.id} >
          <DetailItem device={this.props.device} handleDismiss={this.handleDismiss}/>
        </div>
      )
    } else {
      return (
        <div className="lst-entry col s12 m6 l4" id={this.props.device.id} onClick={this.handleDetail}>
          <SummaryItem device={this.props.device} />
        </div>
      )
    }
  }
}

class ListRender extends Component {
  constructor(props) {
    super(props);

    this.state = {detail: null};
    this.setDetail = this.setDetail.bind(this);
  }

  setDetail(id) {
    this.setState({detail: id});
  }

  render() {
    if (this.props.loading) {
      return (
        <div className="background-info valign-wrapper full-height">
          <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
        </div>
      )
    }

    // handles reordering of cards to keep horizontal alignment
    const target = this.state.detail;
    const horSize = 3;
    let display_list = JSON.parse(JSON.stringify(this.props.devices));
    display_list.move = function(from, to) {
      this.splice(to, 0, this.splice(from, 1)[0]);
    }
    if (target != null) {
      for (let i = 0; i < display_list.length; i++) {
        if (display_list[i].id == target) {
          display_list.move(i,i - (i % horSize));
          break;
        }
      }
    }

    if (display_list.length > 0) {
      return (
        <div className="row">
          <div className="col s12  lst-wrapper">

            { display_list.map((device, idx) =>
              <ListItem device={device} key={device.id}
                detail={device.id === this.state.detail}
                setDetail={this.setDetail}
              />
            )}


          </div>
        </div>
      )
    } else {
      return  (
        <div className="background-info valign-wrapper full-height">
          <span className="horizontal-center">No configured devices</span>
        </div>
      )
    }
  }
}

function MapRender(props) {
  const deviceList = props.devices;
  return (
    <div>
      <p>map goes here!</p>
    </div>
  )
}

class DeviceList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDisplayList: true,
      filter: '',
    };

    this.handleViewChange = this.handleViewChange.bind(this);
    this.applyFiltering = this.applyFiltering.bind(this);
  }

  handleViewChange(event) {
    this.setState({isDisplayList: ! this.state.isDisplayList})
  }

  // handleSearchChange(event) {
  //   const filter = event.target.value;
  //   let state = this.state;
  //   state.filter = filter;
  //   state.detail = undefined;
  //   this.setState(state);
  // }

  applyFiltering(deviceList) {
    const filter = this.state.filter;
    const idFilter = filter.match(/id:\W*([-a-fA-F0-9]+)\W?/);

    return deviceList.filter(function(e) {
      let result = false;
      if (idFilter && idFilter[1]) {
        result = result || e.id.toUpperCase().includes(idFilter[1].toUpperCase());
      }

      return result || e.label.toUpperCase().includes(filter.toUpperCase());
    });
  }

  render() {
    const filteredList = this.applyFiltering(this.props.devices);

    return (
      <div className="col m10 s12 offset-m1 relative full-height">

        {(this.state.isDisplayList) ? (
            <ListRender devices={filteredList} loading={this.props.loading} />
        ) : (
            <MapRender devices={filteredList} loading={this.props.loading}/>
        )}

        {/* <!-- footer --> */}
        <div className="col s12"></div>
        <div className="col s12">&nbsp;</div>
      </div>
    )
  }
}

class Devices extends Component {

  constructor(props) {
    super(props);

    this.filterChange = this.filterChange.bind(this);
  }

  componentDidMount() {
    DeviceActions.fetchDevices.defer();
  }

  filterChange(newFilter) {
    console.log("about to change filter: " + newFilter);
  }

  render() {
    return (
      <ReactCSSTransitionGroup
        transitionName="first"
        transitionAppear={true}
        transitionAppearTimeout={500}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500} >
        <PageHeader title="device manager" subtitle="Devices" shadow='true'>
          {/* <Filter onChange={this.filterChange} /> */}
          <Link to="/device/new" className="btn-item btn-floating waves-effect waves-light cyan darken-2">
            <i className="fa fa-plus"/>
          </Link>
        </PageHeader>
        <AltContainer store={DeviceStore}>
          <DeviceList />
        </AltContainer>
        {/* <NewDevice /> */}
      </ReactCSSTransitionGroup>
    );
  }
}

export { Devices };

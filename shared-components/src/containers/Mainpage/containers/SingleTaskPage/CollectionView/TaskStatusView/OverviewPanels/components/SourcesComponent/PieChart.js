import React, { PureComponent } from 'react';
import { PieChart, Pie, Sector } from 'recharts';

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 }
];

const renderActiveShape = props => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
    name,
    color
  } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={0} textAnchor="middle" fill={'black'}>
        {name}
      </text>
      <text x={cx} y={cy} dy={16} textAnchor="middle" fill={'black'}>
        {value} snippet{value > 1 && 's'}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={color}
        opacity={0.3}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={color}
      />
    </g>
  );
};

export default class Piechart extends PureComponent {
  static jsfiddleUrl = 'https://jsfiddle.net/alidingling/hqnrgxpj/';

  state = {
    activeIndex: 0
  };

  onPieEnter = (data, index) => {
    this.setState({
      activeIndex: index
    });
    console.log(index);
  };

  render() {
    let { domains } = this.props;
    domains = domains.map(d => {
      return { ...d, name: d.domain, value: d.numberOfPieces };
    });

    return (
      <PieChart width={200} height={200}>
        <Pie
          activeIndex={this.state.activeIndex}
          activeShape={renderActiveShape}
          data={domains}
          cx={90}
          cy={90}
          innerRadius={65}
          outerRadius={80}
          fill="#aaa"
          dataKey="value"
          onMouseEnter={this.onPieEnter}
        />
      </PieChart>
    );
  }
}

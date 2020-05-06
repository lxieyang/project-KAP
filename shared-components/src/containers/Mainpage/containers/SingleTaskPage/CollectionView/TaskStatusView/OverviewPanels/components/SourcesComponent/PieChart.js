import React, { PureComponent } from 'react';
import { PieChart, Pie, Sector, Cell } from 'recharts';

const RADIAN = Math.PI / 180;

const renderActiveShape = props => {
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
    favicon,
    name,
    value,
    color
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 6;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  return (
    <g>
      {' '}
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        strokeWidth={2}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <image
        href={favicon}
        height={12}
        width={12}
        x={ex + (cos >= 0 ? 1 : -1) * 12 - 6 + (cos >= 0 ? 3 : -3)}
        y={ey - 9}
      />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12 + (textAnchor === 'start' ? 12 : -12)}
        y={ey}
        textAnchor={textAnchor}
        style={{ fontStyle: 'italic' }}
        fill="black"
      >
        <image href={favicon} height={12} width={12} />
        {name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={14}
        textAnchor={textAnchor}
        fill="black"
      >
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
        // opacity={0.3}
      />
    </g>
  );
};

const renderCustomizedLabel = props => {
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
    favicon,
    name,
    value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 6;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <image
        href={favicon}
        height={12}
        width={12}
        x={ex + (cos >= 0 ? 1 : -1) * 12 - 6 + (cos >= 0 ? 3 : -3)}
        y={ey - 9}
      />

      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12 + (textAnchor === 'start' ? 12 : -12)}
        y={ey}
        textAnchor={textAnchor}
        style={{ fontStyle: 'italic' }}
        fill="#666"
      >
        <image href={favicon} height={12} width={12} />
        {name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={14}
        textAnchor={textAnchor}
        fill="#999"
      >
        {value} snippet{value > 1 && 's'}
      </text>
    </g>
  );
};

export default class Piechart extends PureComponent {
  state = {
    activeIndex: -1
  };

  componentDidUpdate(prevProps) {
    if (prevProps.selectedDomains !== this.props.selectedDomains) {
      if (this.props.selectedDomains.length > 0) {
        const domains = this.props.domains.map(d => d.domain);
        this.setState({
          activeIndex: domains.indexOf(this.props.selectedDomains[0])
        });
      } else {
        this.setState({ activeIndex: -1 });
      }
    }
  }

  onPieEnter = (data, index) => {
    this.setState({
      activeIndex: index
    });
    this.props.setSelectedDomains([data.domain]);
  };

  onPieLeave = (data, index) => {
    this.setState({ activeIndex: -1 });
    this.props.clearSelectedDomains();
  };

  render() {
    let { domains } = this.props;
    domains = domains.map(d => {
      return { ...d, name: d.domain, value: d.numberOfPieces };
    });

    let data = domains;

    return (
      <PieChart width={400} height={200}>
        <Pie
          isAnimationActive={false}
          activeIndex={this.state.activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx={180}
          cy={80}
          labelLine={false}
          label={renderCustomizedLabel}
          // innerRadius={40}
          outerRadius={40}
          fill="#aaa"
          dataKey="value"
          onMouseEnter={this.onPieEnter}
          onMouseLeave={this.onPieLeave}
        >
          {data.map((d, index) => (
            <Cell
              key={`cell-${index}`}
              fill={d.color}
              opacity={this.state.activeIndex !== -1 ? 0.3 : 1}
            />
          ))}
        </Pie>
      </PieChart>
    );
  }
}

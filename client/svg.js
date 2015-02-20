//-Copyright 2015 Krzysztof Daniel Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at     http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
(function(d3) {
    var body=d3.select('body');
    var mapid = body.attr('data-mapid');
    d3.json('/api/map/' + mapid, renderChart);

    function pick(key) {
        return function(d) {
            return d[key];
        };
    }
    function unitify(unit) {
        return function(d) {
            return '' + d + unit;
        };
    }
    function renderChart(err, mapo) {
        if (err) {
            console.log(err); // TODO display something
            return;
        }


        var margin = {top: 20, right: 20, bottom: 20, left: 20};
        var width = 960 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;

        var x = d3.scale.linear().range([0, width]);
        var y = d3.scale.linear().range([0, height]);

        var mapViz = d3.select('.map')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var map = mapo.history[0];
        var nodes = _.groupBy(map.nodes, 'componentId');

        var connections = map.connections.map(function(c) {
            return [ nodes[c.pageSourceId][0], nodes[c.pageTargetId][0] ];
        });

        var line = d3.svg.line()
        .x(_.compose(x, pick('positionX')))
        .y(_.compose(y, pick('positionY')));


        mapViz
        .selectAll('.connection')
        .data(connections)
        .enter()
        .append('path')
        .classed('connection', true)
        .attr('d', line);

        mapViz
        .selectAll('circle')
        .data(map.nodes)
        .enter()
        .append('circle')
        .attr('r', '10px')
        .attr('cx', _.compose(unitify('px'), x, pick('positionX')))
        .attr('cy', _.compose(unitify('px'), y, pick('positionY')));

    }


})(window.d3)

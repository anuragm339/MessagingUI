/**
 * Custom Date prototypes for standardized timestamps
 */
Date.prototype.today = function () {
    return this.getFullYear() + "/" + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ ((this.getDate() < 10)?"0":"") + this.getDate();
}

Date.prototype.timeNow = function () {
    return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

/**
 * Main Application Object
 */
let App = {
        // Configuration for dagreD3 layouts
        styles: {
            "Standard": {
                rankdir: "BT",
                ranksep: 50,
                nodesep: 50,
                edgesep: 10
            },
            "Standard LR": {
                rankdir: "RL",
                ranksep: 50,
                nodesep: 50,
                edgesep: 10
            },
            "Packed": {
                rankdir: "BT",
                ranksep: 10,
                nodesep: 10,
                edgesep: 5
            },
            "Packed LR": {
                rankdir: "RL",
                ranksep: 10,
                nodesep: 10,
                edgesep: 5
            }
        },

        render: new dagreD3.render(),

        init: function() {
            $("#svg-canvas").attr("height", window.innerHeight - 50);

            $("#styleSelector").append(
                Object.keys(this.styles).map((key) =>
                    `<option value="${key}">${key}</option>`
                ).join("")
            );

            $("option[value='Packed LR']")[0].setAttribute("selected", "");

            this.drawGraph();

            // Event Listeners
            $("#nameSelector").change((e) => this.drawGraph());
            $("#styleSelector").change((e) => this.drawGraph());
            $("#parentSelector").change((e) => this.drawGraph());
            $("#refresh").click((e) => this.drawGraph());

            // Auto-refresh logic (every 60 seconds)
            setInterval(() => {
                let shouldRefresh = $("#autorefresh").prop('checked');
                if(shouldRefresh) {
                    this.drawGraph();
                }
            }, 60000);
        },

        drawGraph: function(){
            this.fetchSummary()
                .then(response => {
                    if(response.ok){
                        return response.json();
                    } else {
                        console.error("Fetch summary failed: error code", response.status);
                        if(response.status === 401) { Login.logout(); }
                    }
                })
                .then(data => {
                    // URL Normalization: mapping legacy/internal URLs to standard API endpoints
                    const jsonString = JSON.stringify(data).replaceAll(
                        "stores.prod.isc.abccloud.com",
                        "api.abc.com"
                    ).replaceAll(
                        "stores.ppe.isc.abccloud.com",
                        "api-ppe.abc.com")
                        .replaceAll("api.prod.retail.abc.com",
                            "api.abc.com")
                        .replaceAll("api.ppe.retail.abc.com",
                            "api-ppe.abc.com");

                    const updatedData = JSON.parse(jsonString);
                    this.massageData(updatedData);
                    this.drawGraphForData(this.getGraph(), updatedData, this.getLabelProvider());
                })
                .catch(e => {
                    console.error("ERROR", e);
                    // Fallback to demoGraph if available
                    if (typeof demoGraph !== 'undefined') {
                        this.drawGraphForData(this.getGraph(), demoGraph, this.getLabelProvider());
                    }
                });
        },

        massageData: function(data) {
            data.root.localUrl = data.root.localUrl.replace('https', 'http');
            if(!data.followers) return;
            data.followers.forEach((node) => {
                if(node.length > 0) {
                    node.following[0] = node.following[0].replace('https', 'http');
                    node.requestedToFollow[0] = node.requestedToFollow[0].replace('https', 'http');
                }
            });
        },

        drawOnStoreInput: function() {
            const storeInput = $("#store").val();
            const storeExpectedFormat = RegExp(/^\d{4,8}$/);
            if (storeExpectedFormat.test(storeInput)) {
                this.drawGraph();
            }
        },

        getGroupsFromStoreInput: async function(country, store) {
            if(Locations.ids[country] && Locations.ids[country][store]) {
                return Locations.ids[country][store];
            }

            const requestInit = { headers: this.getHeadersWithAuthorization() };
            let locationId;

            await fetch(this.getLocationIdUrl(country, store), requestInit)
                .then(response => response.json())
                .then(data => {
                    locationId = data.locationId;
                });

            Locations.ids[country] = { ...Locations.ids[country], [store]: locationId };
            return locationId;
        },

        fetchSummary: async function() {
            var groups = $("#groups").val()
                .split(",")
                .filter(x=>x)
                .map(x=> "groups="+x)
                .join("&");

            if(groups) { groups = "?" + groups; }

            const country = $("#country").val();
            const store = $("#store").val();
            let resolvedGroup;

            if(country && store){
                resolvedGroup = await this.getGroupsFromStoreInput(country, store);
            }

            if(resolvedGroup) {
                groups = "?groups=" + resolvedGroup;
            }

            return fetch(Config.registryUrl + groups, { headers: this.getHeadersWithAuthorization() });
        },

        getHeadersWithAuthorization: function() {
            const requestHeaders = new Headers();
            if (Login.user.token_expires != null && Login.user.token_expires  group)).forEach(group => {
                let storeName = Object.keys(Locations.stores).find(key => Locations.stores[key] === group) || group;
                g.setNode(group, {label: storeName, clusterLabelPos: 'bottom'});
            });

            data.followers.forEach((node) => {
                let {group, id, status} = node;
                g.setParent(id, group);
                g.setNode(id, {
                    ...node,
                    behindRoot: App.difference(data.root, node),
                    label: labelProvider(node),
                    class: status.toLowerCase()
                });

                let urlToId = (url) => {
                    const httpsUrl = url.replace(/^http:\/\//, 'https://');
                    const cleanRootUrl = data.root.localUrl.replace(/^http:\/\//, 'https://');
                    return (httpsUrl === cleanRootUrl) ? data.root.localUrl : group + "|" + url;
                };

                let parentSelector = $("#parentSelector").val();
                if(parentSelector === "requestedVsActual") {
                    if(node.requestedToFollow && node.requestedToFollow[0]) {
                        g.setEdge(id, urlToId(node.requestedToFollow[0]), {
                            style: "stroke: lightcoral; fill: none;",
                            arrowheadStyle: `stroke: lightcoral; fill: lightcoral;`
                        });
                    }
                    if(node.following && node.following[0]) {
                        let color = (node.requestedToFollow && node.following[0] == node.requestedToFollow[0]) ? "black" : "grey";
                        g.setEdge(id, urlToId(node.following[0]), {
                            style: `stroke: ${color}; fill: none;`,
                            arrowheadStyle: `stroke: ${color}; fill: ${color};`
                        });
                    }
                } else {
                    let following = node[parentSelector];
                    if(following && following[0]) {
                        g.setEdge(id, urlToId(following[0]));
                    }
                }
            });
        }

        g.nodes().forEach(v => {
            let node = g.node(v);
            if(node) { node.rx = node.ry = 5; }
        });

        // Zoom & Pan functionality
        let zoom = d3.zoom().on("zoom", function() {
            svgGroup.attr("transform", d3.event.transform);
        });
        svg.call(zoom);

        // Render Graph
        this.render(d3.select("svg g"), g);

        // Apply Tooltips
        svgGroup.selectAll("g.node").each(function(id) {
            tippy(this, {
                content: App.tooltip(g.node(id)),
                arrow: true,
                placement: "right",
                theme: "light-border",
                interactive: true,
                delay: [50, 300]
            });
        });

        App.updateLastRefreshTime();
    },

    tooltip: function(data) {
    let following = data.following ? data.following.join('<br>') : "";
    let requestedToFollow = data.requestedToFollow ? data.requestedToFollow.join('<br>') : "";

    let providerInfo = data.provider ? `
            <th>Provider info</th>
            <tr><td>Offset Sent</td><td>${data.provider.lastOffsetSent}</td></tr>
            <tr><td>Offset Acked</td><td>${data.provider.lastAckedOffset}</td></tr>
        ` : "";

    let pipeInfo = data.pipe ? `
            <th>Pipe info</th>
            <tr><td>IP</td><td>${data.pipe.ip}</td></tr>
            <tr><td>State</td><td>${data.pipe.pipeState}</td></tr>
        ` : "";

    let offsetsInfo = data.offsets ? `
            <th>Offset info</th>
            <tr><td>Pipe Offset</td><td>${data.offsets.PIPE_OFFSET} (${data.behindRoot})</td></tr>
        ` : `<th>Offset info</th><tr><td>Pipe Offset</td><td>${data.offset}</td></tr>`;

    return `
            ${data.localUrl}
            <table>
                <th>Status Info</th>
                <tr><td>Status</td><td>${data.status}</td></tr>
                <tr><td>Last seen</td><td>${data.lastSeen}</td></tr>
                ${offsetsInfo}
                ${pipeInfo}
                ${providerInfo}
            </table>
        `;
},

getLabelProvider: function() {
    let property = $("#nameSelector").val();
    return (node) => {
        try { return property.split('.').reduce((a, b) => a[b], node); }
        catch (e) { return ""; }
    }
},

getLocationIdUrl: function(country, store) {
    return './location/' + store + '/' + country;
},

updateLastRefreshTime: function() {
    var currentdate = new Date();
    document.getElementById("last-refresh-time").innerText = currentdate.today() + "@" + currentdate.timeNow();
},

getGraph: function() {
    let g = new dagreD3.graphlib.Graph({compound:true})
        .setGraph(this.styles[$("#styleSelector").val()])
        .setDefaultEdgeLabel((v, w) => {
            return { label: App.difference(g.node(w), g.node(v)) };
        });
    return g;
},

normalise: function(str){
    if(!str) return null;
    return str
        .replace(/([A-Z]+)/g, ' $1')
        .toLowerCase()
        .replace(/^./, s => s.toUpperCase());
},

difference: function(node, nodeFollowing) {
    if (node && node.offsets && nodeFollowing.offsets) {
        return node.offsets.PIPE_OFFSET - nodeFollowing.offsets.PIPE_OFFSET;
    } else if (node && nodeFollowing.offsets) {
        return node.offset - nodeFollowing.offsets.PIPE_OFFSET;
    } else {
        return "NaN";
    }
}
};

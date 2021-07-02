# iunctio

Website available [here](https://iunctio.radu.space).

## Project Setup

To locally host the project, just clone the source code and run the following commands from a terminal:

```
npm install
npm run serve
```

To build the project for production, run the following:

```
npm run build
```

The project uses Vue with TypeScript; styling is done with SCSS. It also uses the javascript `graphology` package for
the graph object and `PIXI.js` for drawing to canvases. There is no backend, files are served statically.

The Vue source is in `src/views` (for the web pages) and in `src/components` (for individual components) and there are
a couple of independent script files in `src/scripts` (TypeScript files).

## About

- [About Us](#about-us)
- [About the Project](#about-the-project)

### About Us

Hi! We are 6 first-year students (at the time of writing) from the [Technical University Eindhoven](https://www.tue.nl)
(TU/e). For the Design-Based Learning course WebTech (2IOA0), we made this website for visualizing dynamic networks.

We came from different backgrounds and had varying levels of expertise in these subjects, but we were all able to learn
what we didn't know and contribute our own share. These are our group members:

- Nidhish Shah: frontend developer, web designer & our dearest SCRUM master
([LinkedIn](https://www.linkedin.com/in/nidhish-s-shah/), [Github](https://nidhishs.github.io/)).
- Stijn Harks: statistical/distribution diagram creator, sunburst diagram creator and bug reporting machine
([LinkedIn](https://www.linkedin.com/in/stijn-harks/), [Github](https://github.com/njitsh)).
- Chris D'Mello: creator of the adjacency matrix and fancy animations.
- Vlad Plăiaşu: one of the arc diagram creators and interactivity expert
([LinkedIn](https://www.linkedin.com/in/vlad-g-plaiasu/), [Github](https://github.com/NeaGogu)).
- Radu Pogonariu: creator of data parsing/storage and master of Git.
- Wout Huynen: one of the arc diagram creators, interactivity contributor and helper to those in need
([LinkedIn](https://www.linkedin.com/in/wout-huynen), [Github](https://github.com/w2ptr)).

### About the Project

`iunctio` is a user-friendly tool for visualizing dynamic networks. Many graphs/networks are dynamic (meaning, they
change over time), and to get a feel for the structure of the network, visualizations are an essential tool. Our
visualizations can also be used to investigate individual nodes more closely in addition to getting a global overview.

Our goal for iunctio was to make an easy-to-understand tool that can visualize the Enron dataset (which encodes e-mail
data, specifically), without requiring a heavy backend, which simplifies the process of hosting massively. The project
uses Vue.js for the rendering, because it is a simple web framework and the group members were able to quickly learn
it.

This project was an excellent learning experience and it taught us a lot about Git, frontend development,
JavaScript/TypeScript and Vue.js.

In addition to this website, a project report/paper and an introductory video are available.

## User Manual

- [Uploading Datasets and Format](#uploading-datasets-and-format)
- [Creating Diagrams](#creating-diagrams)
- [Diagrams and their Options](#diagrams-and-their-options)
  - [Arc Diagram](#arc-diagram)
  - [Sunburst Diagram](#sunburst-diagram)
  - [Statistical Diagram](#statistical-diagram)
- [List of Features](#list-of-features)
  - [Brushing-and-Linking](#brushing-and-linking)
  - [Timeline](#timeline)
  - [Clustering](#clustering)

### Uploading Datasets and Format

When you want to create a diagram, it needs to work on a data set. Unless you choose to use a data set you previously
uploaded, you will also have to upload a data set that the diagram can work with.

Iunctio currently supports only CSV files. Each row represents an e-mail between two people, and the file needs to have
the following columns:

- `date`: the date at which the e-mail was sent (ISO 8601 date format, yyyy-mm-dd)
- `fromId`: a numeric ID that represents the person that sent the e-mail
- `fromEmail`: the e-mail address from the person that sent the e-mail
- `fromJobtitle`: the job title from the person that sent the e-mail
- `toId`: a numeric ID that represents the recipient of the email
- `toEmail`: the recipient's e-mail address
- `toJobtitle`: the recipient's e-mail address
- `messageType`: the message type: either TO (recipient) or CC (Carbon Copy, additional recipient)
- `sentiment`: a decimal value between -1.0 and 1.0 that represents how positive the e-mail was

After you've uploaded the data set, it will store the data set on your computer's local storage, which means it remains
even if you close the browser and continue later.

### Creating Diagrams

To create a diagram, simply pick one of the given diagram types and pick a data set (or upload a new one). This will
add a diagram to the list. For each diagram, there is a number of settings you can change by clicking, the little
"gear" icon in the bottom left corner, for example the diagram's name and other options that are specific to the
diagram.

Just like the data sets uploaded, the diagrams you have created and their settings are stored on your computer's local
storage, which means you can close the browser and your progress will not be erased (assuming you don't delete the
browser's localstorage).

### Diagrams and their Options

There are four different types of diagram available and each diagram has its own advantages, disadvantages and use
cases.

#### Arc Diagram

The Arc Diagram is a kind of node-link diagram. The nodes (in this case, someone who sent or received an e-mail) are
represented as circles that are placed next to each other. You can also turn it into a Chord Diagram, which means the
nodes are placed in a circle.

If there is an edge (i.e. connection/e-mail) between two nodes, an arc is drawn between them. To see more clearly how a
node is connected, you can simply hover over a node and it will highlight the edges that are connected to it. You can
choose whether you want to highlight all edges that are connected, only e-mails that were sent, or only e-mails that
were received by this person.

Clicking on a node also highlights it in this and other diagrams; see the brushing-and-linking section for more
information.

Finally, [clustering](#clustering) and the [timeline](#timeline) features are implemented for the arc diagram, which
help reduce clutter.

The Arc Diagram is mainly useful for getting a global overview of the dataset.

#### Sunburst Diagram

The Sunburst Diagram is a "hierarchical" diagram. It displays the nodes in a circle, drawing one or more nodes in the
center and drawing each other node outward if it is connected to that node (i.e. if there is an e-mail between these
two people).

It can also be turned into a Flame Diagram or Inverse Flame Diagram, which work in the same way, except they display
the nodes bottom-to-top or top-to-bottom respectively instead of radially.

If no root is picked, every node and its connections is displayed. Otherwise, you can look at a root more closely by
picking a node to be the center node; this can be done by either selecting it in the settings or by double-clicking it in the diagram.

Just like for the Arc Diagram, you can choose whether you want to display connections for someone if an e-mail was sent
from that person to another person, the other way around, or both. In addition, the maximum number of layers that are
displayed in the diagram can be customized. You can change the colors as well: by default a "rainbow" pallete is used,
but you can also color nodes based on e.g. their job title. Finally, if you want to omit nodes that only have a couple
of connections, you can change the minimum render size.

Clicking on a node highlights the node in this and other diagrams; see the brushing-and-linking section for more
information The [timeline](#timeline) feature is implemented for the sunburst diagram as well.

#### Statistical Diagram

If you want to get a good overview of when e-mails were sent, the Statistical Diagram is a good option. It shows a
statistical of e-mails over the lifespan of the data set.

You can pick either a distribution diagram or histogram; the former shows the height for each point in time, while the
histogram divides the time up into buckets and then counts the nodes for each of those buckets.

To reduce clutter from very high spikes, there is also an option to display the logarithm of the frequencies, so the
graph is smoothened out and lower frequencies are still visible.

There are three varieties of the statistical diagram: the email frequency diagram, the total sentiment diagram and the
average sentiment diagram. The former shows the distribution of emails over time, while the latter two give the
average/total sentiment of emails for each moment in time.

#### Adjacency Matrix

The adjacency matrix is useful for identifying communities/clusters within the data set and looking at how individual
nodes behave.

There are three varieties available: the edge-frequency matrix (which colors the squares according to the number of
edges between the two nodes), the sentiment matrix (which colors the squares according to the average sentiment of
those emails) and the email type matrix (which colors them according to the email type, TO or CC).

The [clustering](#clustering), hover interactivity, [brushing-and-linking](#brushing-and-linking) and
[timeline](#timeline) features are implemented for the adjacency matrix as well.

### List of Features

In addition to the three diagrams listed above, there are additional features implemented to make the visualizations more effective.

#### Brushing-and-Linking

To make it easier to see connections between diagrams and find correlations, brushing-and-linking is a useful feature.
If any node is clicked, this will select the node globally and automatically highlight that node in each graph (at
least, those that refer to the same data set). You can even hold control while clicking, which allows you to select
multiple nodes at once, meaning each of those nodes will be highlighted in the diagrams.

#### Timeline

Some diagrams support a "timeline". To activate this, go to the settings and check "Show Timeline". This will display a
statistical diagram below the diagram, which you can use to select the time range. Setting the time range will adjust
the diagram, so it now only displays the edges in that specific time range.

This could be useful if you see there is a little/lot of activity going on at a certain moment and you want to look at
it more closely.

#### Clustering

When the diagram is made, a clustering algorithm is run on in. This means that groups of people that communicate a lot
with each other are identified and the diagram is sorted in such a way that these groups are close together. This makes
the diagrams less cluttered.

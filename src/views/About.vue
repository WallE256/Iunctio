<template>
  <div class="text-page">
    <main class="text-page__content">
      <h2 id="contents"><a href="#contents">Contents</a></h2>

      <ol>
        <li>
          <a href="#about-us">About Us</a>
        </li>
        <li>
          <a href="#about-the-project">About the Project</a>
        </li>
        <li>
          <a href="#user-manual">User Manual</a>
        </li>
      </ol>

      <h2 id="about-us"><a href="#about-us">About Us</a></h2>

      <p>Hi! We are 6 first-year students (at the time of writing) from the <a href="https://www.tue.nl">Technical
      University Eindhoven</a> (TU/e). For the Design-Based Learning course WebTech (2IOA0), we made this website for
      visualizing dynamic networks.</p>

      <p>We came from different backgrounds and had varying levels of expertise in these subjects, but we were all able
      to learn what we didn't know and contribute our own share. These are our group members:</p>

      <!-- Link to LinkedIn/github maybe? -->
      <ol>
        <li>
          Nidhish Shah: frontend developer, web designer &amp; our dearest SCRUM master.
        </li>
        <li>
          Stijn Harks: statistical/distribution diagram creator, sunburst diagram creator and bug reporting machine.
        </li>
        <li>
          Chris D'Mello: creator of the adjacency matrix and fancy animations.
        </li>
        <li>
          Vlad Plăiaşu: one of the arc diagram creators and interactivity expert.
        </li>
        <li>
          Radu Pogonariu: creator of data parsing/storage and master of Git.
        </li>
        <li>
          Wout Huynen: one of the arc diagram creators, interactivity contributor and helper to those in need.
        </li>
      </ol>

      <h2 id="about-the-project"><a href="#about-the-project">About the Project</a></h2>

      <p><span style="font-family: consolas;">iunctio</span> is a user-friendly tool for visualizing dynamic networks.
      Many graphs/networks are dynamic (meaning, they change over time), and to get a feel for the structure of the
      network, visualizations are an essential tool. Our visualizations can also be used to investigate individual
      nodes more closely in addition to getting a global overview.</p>

      <p>Our goal for iunctio was to make an easy-to-understand tool that can visualize the Enron dataset (which
      encodes e-mail data, specifically), without requiring a heavy backend, which simplifies the process of hosting
      massively. The project uses Vue.js for the rendering, because it is a simple web framework and the group members
      were able to quickly learn it.</p>

      <p>This project was an excellent learning experience and it taught us a lot about Git, frontend
      development, JavaScript/TypeScript and Vue.js.</p>

      <!-- TODO: add a link to the paper -->
      <p>In addition to this website, a project report/paper and an introductory video are available.</p>

      <h2 id="user-manual"><a href="#user-manual">User Manual</a></h2>

      <p>Go to <a href="/user-manual">User Manual</a> for a detailed explanation about the website's capabilities.</p>
    </main>
  </div>
</template>

<style scoped lang="scss" src="@/assets/styles/text-page.scss"></style>

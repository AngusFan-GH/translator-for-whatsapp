<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">用户画像</router-link>
    </div>
    <router-view class="view-container" />
  </div>
</template>

<style lang="scss">
html,
body {
  padding: 0;
  margin: 0;
  height: 100%;
  overflow: hidden;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  display: flex;
  flex-direction: column;
}

#nav {
  display: flex;
  height: 39px;
  flex-shrink: 0;
  padding: 10px 16px;
  align-items: center;
  justify-content: center;
  a {
    font-weight: bold;

    text-decoration: none;

    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
.view-container {
  flex: 1;
}
</style>

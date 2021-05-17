<template>
  <div class="hello">
    <h1>{{ data }}</h1>
  </div>
</template>

<script>
import { MESSAGER_SENDER } from "../../../common/modal/index";

export default {
  name: "CustomPortrait",
  data() {
    return {
      data: null,
    };
  },
  created() {
    this.$Messager.post(
      MESSAGER_SENDER.CONTENT,
      "customPortraitPageInit",
      true,
      undefined,
      window.top
    );
    this.$Messager
      .receive(MESSAGER_SENDER.CONTENT, "getCustomPortraitFinish")
      .subscribe((e) => {
        console.log("getCustomPortraitFinish", e.message);
      });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  padding: 0;

  list-style-type: none;
}
li {
  display: inline-block;

  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

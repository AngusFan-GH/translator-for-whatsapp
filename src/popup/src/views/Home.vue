<template>
  <div class="home">
    <CustomPortrait />
  </div>
</template>

<script>
// @ is an alias to /src
import CustomPortrait from "@/components/CustomPortrait.vue";

export default {
  name: "Home",
  components: {
    CustomPortrait,
  },
};
</script>

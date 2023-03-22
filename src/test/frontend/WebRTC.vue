<template>
  <div>
    <el-form-item>
      <el-button @click="connectPeer">connect</el-button>
      <el-button @click="disConnectPeer">disconnect</el-button>
      <el-input v-model="msg" style="width: 100px"/>
      <el-button @click="send">send</el-button>

      <div>{{receive}}</div>
    </el-form-item>
    <el-form-item>

    </el-form-item>
  </div>
</template>

<script>
export default {
  name: "WebRTC",
  data(){
    return {
      msg:'',
      receive:'',
      sendChannel:null,
      receiveChannel:null,
      localConnection:null,
      remoteConnection:null,

    }
  },
  mounted() {
    console.log(this.$electron);
  },
  methods:{
    connectPeer(){
      let _this=this;
      function handleCreateDescriptionError(error) {
        console.log("Unable to create an offer: " + error.toString());
      }
      function handleAddCandidateError() {
        console.log("Oh noes! addICECandidate failed!");
      }
      function handleSendChannelStatusChange(event) {
        if (_this.sendChannel) {
          var state = _this.sendChannel.readyState;

          if (state === "open") {
            /*messageInputBox.disabled = false;
            messageInputBox.focus();
            sendButton.disabled = false;
            disconnectButton.disabled = false;
            connectButton.disabled = true;*/
          } else {
            /*messageInputBox.disabled = true;
            sendButton.disabled = true;
            connectButton.disabled = false;
            disconnectButton.disabled = true;*/
          }
        }
      }



      this.localConnection = new RTCPeerConnection();
      this.sendChannel = this.localConnection.createDataChannel("sendChannel");
      this.sendChannel.onopen = handleSendChannelStatusChange;
      this.sendChannel.onclose = handleSendChannelStatusChange;


      this.remoteConnection = new RTCPeerConnection();


      this.remoteConnection.ondatachannel = function(event){
        _this.receiveChannel = event.channel;

        function handleReceiveChannelStatusChange(event) {
          if (_this.receiveChannel) {
            console.log("Receive channel's status has changed to " +
                _this.receiveChannel.readyState);
          }
        }

        _this.receiveChannel.onmessage = function(event){
          _this.receive=event.data;
        }
        _this.receiveChannel.onopen = handleReceiveChannelStatusChange;
        _this.receiveChannel.onclose = handleReceiveChannelStatusChange;
      };

      this.localConnection.onicecandidate=function(e){
        if(e.candidate){
          _this.remoteConnection.addIceCandidate(e.candidate).catch(handleAddCandidateError);
        }
      }

      this.remoteConnection.onicecandidate=function(e){
        if(e.candidate){
          _this.localConnection.addIceCandidate(e.candidate).catch(handleAddCandidateError);
        }
      }



      this.localConnection.createOffer()
          .then(offer =>{
            return _this.localConnection.setLocalDescription(offer)
          })
          .then(() =>{
            return _this.remoteConnection.setRemoteDescription(_this.localConnection.localDescription)
          })
          .then(() =>{
            return _this.remoteConnection.createAnswer()
          })
          .then(answer => {
            return _this.remoteConnection.setLocalDescription(answer)
          })
          .then(() => {
            return _this.localConnection.setRemoteDescription(_this.remoteConnection.localDescription)
          })
          .catch(handleCreateDescriptionError);




    },
    disConnectPeer(){
      this.sendChannel.close();
      this.receiveChannel.close();

      // Close the RTCPeerConnections

      this.localConnection.close();
      this.remoteConnection.close();

      this.sendChannel = null;
      this.receiveChannel = null;
      this.localConnection = null;
      this.remoteConnection = null;

      // Update user interface elements

      /*connectButton.disabled = false;
      disconnectButton.disabled = true;
      sendButton.disabled = true;

      messageInputBox.value = "";
      messageInputBox.disabled = true;*/
    },
    send(){
      this.sendChannel.send(this.msg);
    }
  }
}
</script>

<style scoped>

</style>
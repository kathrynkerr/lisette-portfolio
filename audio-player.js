$(function(){
  window.AudioPlayer = function (control, sources, options) {
    this.control = control;
    options = options || AudioPlayer.defaults;
    options = $.extend({
      size: 'medium',
      backColorClass: '',
      controlColorClass: '',
      sliderColorClass: '',
      progressColorClass: '',
      textColorClass: ''
    }, options);
    this.template = '<div class="audio-container"><div class="loading">\
      <div class="fa fa-refresh fa-spin fa-2x"></div>\
    </div>\
    <div class="play-pause-btn fa fa-play fa-2x">\
    </div>\
    <div class="controls">\
      <span class="current-time">0:00</span>\
      <div class="slider" data-direction="horizontal">\
        <div class="progress">\
          <div class="pin" id="progress-pin" data-method="rewind"></div>\
        </div>\
      </div>\
      <span class="total-time">0:00</span>\
    </div>\
    <div class="volume">\
      <div class="volume-btn fa fa-volume-up fa-2x">\
      </div>\
      <div class="volume-controls hidden">\
        <div class="slider" data-direction="vertical">\
          <div class="progress">\
            <div class="pin" id="volume-pin" data-method="changeVolume"></div>\
          </div>\
        </div>\
      </div>\
    </div></div>';
    this.AudioPlayer(sources, options);
  };
  window.AudioPlayer.prototype = {
    AudioPlayer: function AudioPlayer(sources, options) {
      var self = this;
      self.draggableClasses = ['pin'];
      self.currentlyDragged = null;

      // Init related components
      self.$root = $(self.control);
      self.$player = $(self.template);
      self.$audio = $('<audio crossorigin></audio>');
      self.$loading = self.$player.find(".loading");
      self.$playpauseBtn = self.$player.find(".play-pause-btn");
      self.$progress = self.$player.find(".controls .progress");
      self.$sliders = self.$player.find(".slider");
      self.$pins = self.$player.find(".pin");
      self.$volumeBtn = self.$player.find(".volume-btn");
      self.$volumeControls = self.$player.find(".volume-controls");
      self.$volumeProgress = self.$player.find(".volume-controls .progress");
      self.$currentTime = self.$player.find(".current-time");
      self.$totalTime = self.$player.find(".total-time");

      // Assemble Player
      self.$root.append(self.$player);
      self.$root.append(self.$audio);
      
      // Setup classes
      if(self.$root.data("size")){
        options.size = self.$root.data("size");
      }
      self.$player.addClass(options.size)
      debugger
      if(self.$root.data("backcolorclass")){
        options.backColorClass = self.$root.data("backcolorclass");
      }
      self.$player.addClass(options.backColorClass);

      if(self.$root.data("controlcolorclass")){
        options.controlColorClass = self.$root.data("controlcolorclass");
      }
      self.$player.addClass(options.controlColorClass);

      if(self.$root.data("textcolorclass")){
        options.textColorClass = self.$root.data("textcolorclass");
      }
      self.$currentTime.addClass(options.textcolorclass);
      self.$totalTime.addClass(options.textcolorclass);

      if(self.$root.data("slidercolorclass")){
        options.sliderColorClass = self.$root.data("slidercolorclass");
      }
      self.$sliders.addClass(options.sliderColorClass);

      if(self.$root.data("progresscolorclass")){
        options.progressColorClass = self.$root.data("progresscolorclass");
      }
      self.$progress.addClass(options.progressColorClass);
      self.$volumeProgress.addClass(options.progressColorClass);
      self.$pins.addClass(options.progressColorClass);

      // Setup sources
      if(self.$root.data("src")){
        sources = self.$root.data("src");
      }
      sources = (sources && sources.constructor === String) ? [sources] : sources;
      $.each(sources, function (index, source) {
        self.$audio.append($('<source>').attr("src", source).attr("type", "audio/mpeg"));
      });
      
      // Audio Options
      if(self.$root.data("loop")){
        options.loop = self.$root.data("loop");
      }
      if(options.loop){
        self.$audio.attr("loop", "true");
      }
      if(self.$root.data("autoplay")){
        options.autoplay = self.$root.data("autoplay");
      }
      if(options.autoplay){
        self.$audio.attr("autoplay", "true");
      }

      // Player Events
      self.$playpauseBtn.on('click', function () {
        self.togglePlay();
      });
      self.$audio.on('timeupdate', function () {
        self.updateProgress();
      });
      self.$audio.on('volumechange', function () {
        self.updateVolume();
      });
      self.$audio.on('loadedmetadata', function () {
        self.$totalTime.text(self.formatTime(self.$audio[0].duration));
      });
      self.$audio.on('canplay', function () {
        self.makePlay();
      });
      self.$audio.on('ended', function () {
        self.$playPause.attr('d', 'M18 12L0 24V0');
        self.$audio[0].currentTime = 0;
      });
      self.$volumeBtn.on('click', function () {
        self.$volumeBtn.toggleClass('open');
        self.$volumeControls.toggleClass('hidden');
      });
      self.$sliders.each(function () {
        var pin = $(this).find('.pin');
        $(this).on('click', function (event) {
          self[pin.data('method')](event);
        });
      });

      // Window Events
      $(window).on('mousedown', function (event) {
        if (!self.isDraggable(event.target)){
          self.$volumeBtn.removeClass('open');
          self.$volumeControls.addClass('hidden');
          return false;
        };
        self.currentlyDragged = event.target;
        var handleMethod = self.currentlyDragged.dataset.method;
        $(window).on('mousemove.' + handleMethod, function (event) {
          self[handleMethod](event);
        });
        $(window).on('mouseup.' + handleMethod, function () {
          self.currentlyDragged = false;
          $(window).off('.' + handleMethod);
        });
      });
      $(window).on('resize', function () {
        self.directionAware();
      });
      self.directionAware();
    },
    isDraggable: function isDraggable(el) {
      var canDrag = false;
      var classes = Array.from(el.classList);
      this.draggableClasses.forEach(function (draggable) {
        if (classes.indexOf(draggable) !== -1) canDrag = true;
      });
      return canDrag;
    },
    getRangeBox: function getRangeBox(event) {
      var rangeBox = event.target;
      var el = this.currentlyDragged;
      if (event.type == 'click' && this.isDraggable(event.target)) {
        rangeBox = event.target.parentElement.parentElement;
      }
      if (event.type == 'mousemove') {
        rangeBox = el.parentElement.parentElement;
      }
      return rangeBox;
    },
    inRange: function inRange(event) {
      var rangeBox = this.getRangeBox(event);
      var rect = rangeBox.getBoundingClientRect();
      var direction = rangeBox.dataset.direction;
      if (direction == 'horizontal') {
        var min = rangeBox.offsetLeft;
        var max = min + rangeBox.offsetWidth;
        if (event.clientX < min || event.clientX > max) return false;
      } else {
        var min = rect.top;
        var max = min + rangeBox.offsetHeight;
        if (event.clientY < min || event.clientY > max) return false;
      }
      return true;
    },
    updateProgress: function updateProgress() {
      var current = this.$audio[0].currentTime;
      var percent = current / this.$audio[0].duration * 100;
      this.$progress.css('width', percent + '%');
      this.$currentTime.text(this.formatTime(current));
    },
    updateVolume: function updateVolume() {
      this.$volumeProgress.css('height', this.$audio[0].volume * 100 + '%');
      if (this.$audio[0].volume >= 0.5) {
        this.$volumeBtn.addClass("fa-volume-up");
        this.$volumeBtn.removeClass("fa-volume-off");
        this.$volumeBtn.removeClass("fa-volume-down");
      } else if (this.$audio[0].volume < 0.5 && this.$audio[0].volume > 0.05) {
        this.$volumeBtn.addClass("fa-volume-down");
        this.$volumeBtn.removeClass("fa-volume-up");
        this.$volumeBtn.removeClass("fa-volume-off");
      } else if (this.$audio[0].volume <= 0.05) {
        this.$volumeBtn.addClass("fa-volume-off");
        this.$volumeBtn.removeClass("fa-volume-up");
        this.$volumeBtn.removeClass("fa-volume-down");
      }
    },
    getCoefficient: function getCoefficient(event) {
      var slider = this.getRangeBox(event);
      var rect = slider.getBoundingClientRect();
      var K = 0;
      if (slider.dataset.direction == 'horizontal') {
        var offsetX = event.clientX - slider.offsetLeft;
        var width = slider.clientWidth;
        K = offsetX / width;
      } else if (slider.dataset.direction == 'vertical') {
        var height = slider.clientHeight;
        var offsetY = event.clientY - rect.top;
        K = 1 - offsetY / height;
      }
      return K;
    },
    rewind: function rewind(event) {
      if (this.inRange(event)) {
        if(this.$audio[0].currentTime)
          this.$audio[0].currentTime = this.$audio[0].duration * this.getCoefficient(event);
      }
    },
    changeVolume: function changeVolume(event) {
      if (this.inRange(event)) {
        this.$audio[0].volume = this.getCoefficient(event);
      }
    },
    formatTime: function formatTime(time) {
      var min = Math.floor(time / 60);
      var sec = Math.floor(time % 60);
      return min + ':' + (sec < 10 ? '0' + sec : sec);
    },
    togglePlay: function togglePlay() {
      if (this.$audio[0].paused) {
        this.$playpauseBtn.addClass("fa-play");
        this.$playpauseBtn.removeClass("fa-pause");
        this.$audio[0].play();
      } else {
        this.$playpauseBtn.addClass("fa-pause");
        this.$playpauseBtn.removeClass("fa-play");
        this.$audio[0].pause();
      }
    },
    makePlay: function makePlay() {
      this.$playpauseBtn.show();
      this.$loading.hide();
    },
    directionAware: function directionAware() {
      if (window.innerHeight < 250) {
        this.$volumeControls.css('bottom', '-4.5em');
        this.$volumeControls.css('left', '4.5em');
      } else if (this.$player.offsetTop < 154) {
        this.$volumeControls.css('bottom', '-13.667em');
        this.$volumeControls.css('left', '-0.25em');
      } else {
        this.$volumeControls.css('bottom', '4.333em');
        this.$volumeControls.css('left', '-0.25em');
      }
    }
  };
  window.AudioPlayer.defaults = {
    size: 'medium',
    backColorClass: 'backColorClass',
    controlColorClass: 'controlColorClass',
    sliderColorClass: 'sliderColorClass',
    progressColorClass: 'progressColorClass',
    textColorClass: 'textColorClass'
  };
  $(".n-audio-player").each(function(index, player){
    new AudioPlayer(player);
  });
})

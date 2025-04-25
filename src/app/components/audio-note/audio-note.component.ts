import {
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as RecordRTC from 'recordrtc';
import { interval, Subscription } from 'rxjs';
import WaveSurfer from 'wavesurfer.js';

declare const annyang: any;

@Component({
  selector: 'app-audio-note',
  templateUrl: './audio-note.component.html',
  styleUrls: ['./audio-note.component.scss']
})
export class AudioNoteComponent implements OnInit, OnDestroy {
  // Interface
  @Input()
  public set url(val: string) {
    if (val) {
      this.dataURL = val;
    } else {
      this.remove();
    }
  }
  @Input() readOnly = false;
  @Output() onRecorded = new EventEmitter();
  @Output() onRemoved = new EventEmitter();
  @Output() onRecordStart = new EventEmitter();
  @Output() onRecordStop = new EventEmitter();
  // Devices
  microphones = [];
  microphone = '';
  error: string = null;
  // Status
  recordStarted = false;
  recording = false;
  recordedTime = 0;
  timer: Subscription = null;
  // Data
  leftSecond = '0:00';
  recordStream = null;
  dataURL = null;
  // Inspector
  audioContext;
  analyser;
  analyserStream;
  scriptProcessor;
  measureStream;
  @ViewChild('meterWrapper') meterWrapper;
  // constants
  MESSAGES = {
    require_microphone: 'Please select microphone.'
  };

  // Display the audio wave animation to the user
  private _waveSurfer: WaveSurfer;
  private _mediaRecorder = null;
  private _chunks = [];

  // Recorder to be used for the collecting the correct audio data to be uploaded
  private _audioRecorder = null;

  constructor(
    private ngZone: NgZone,
    public domSanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.readOnly) {
      const permission = await navigator.permissions.query({
        name: 'microphone' as any
      });
      if (permission.state === 'granted') {
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => this.loadDevices(devices))
          .catch((err) => this.onErrorHandle('Device Capture', err));
      }
    }
  }

  ngOnDestroy(): void {
    this.closeMicStream();
    this.analyserStream && this.analyserStream.disconnect(this.analyser);
    this.analyser && this.analyser.disconnect(this.scriptProcessor);
    this.scriptProcessor &&
      this.scriptProcessor.disconnect(this.audioContext.destination);
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null;
    }
    this.scriptProcessor = null;
    this.analyserStream = null;
    this.analyser = null;
  }

  onErrorHandle(operation: string, err: Error) {}

  /**
   * Load Devices
   * @param devices: devices
   */
  loadDevices(devices: any[]): void {
    const loadedDeviceIds = [];
    const microphoneList = [];
    devices.forEach((device) => {
      if (device.kind === 'audioinput') {
        if (
          loadedDeviceIds.indexOf(device.deviceId) === -1 &&
          device.deviceId !== 'communications' &&
          device.deviceId !== 'default'
        ) {
          microphoneList.push(device);
        }
      }
    });
    this.microphones = microphoneList;
    if (this.microphones[0]?.deviceId) {
      this.microphone = this.microphones[0]?.deviceId;
      this.selectDevice(this.microphones[0]?.deviceId);
    }
  }

  /**
   * Select microphone and reset the volumn meter
   * @param $event: string
   * @returns
   */
  selectDevice($event): void {
    this.error = null;
    this.analyserStream && this.analyserStream.disconnect(this.analyser);
    this.analyser && this.analyser.disconnect(this.scriptProcessor);
    this.scriptProcessor &&
      this.scriptProcessor.disconnect(this.audioContext.destination);
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null;
    }
    this.scriptProcessor = null;
    this.analyserStream = null;
    this.analyser = null;
    this.closeMeasureStream();
    if (!$event) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: { deviceId: { exact: $event } },
        video: false
      })
      .then((stream) => {
        this.measureStream = stream;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyserStream = this.audioContext.createMediaStreamSource(stream);
        this.scriptProcessor = this.audioContext.createScriptProcessor(
          2048,
          1,
          1
        );

        this.analyser.smoothingTimeConstant = 0.8;
        this.analyser.fftSize = 1024;

        this.analyserStream.connect(this.analyser);
        this.analyser.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.audioContext.destination);
        this.scriptProcessor.onaudioprocess = () => {
          const array = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(array);
          const arraySum = array.reduce((a, value) => a + value, 0);
          const average = arraySum / array.length;
          const numberOfPidsToColor = Math.round(average / 10);
          if (this.meterWrapper?.nativeElement) {
            const allPids = Array.from(
              this.meterWrapper.nativeElement.querySelectorAll('.pid')
            );
            const pidsToColor = allPids.slice(0, numberOfPidsToColor);
            for (const pid of allPids) {
              const pidEl = <HTMLDivElement>pid;
              pidEl.style.backgroundColor = '#e6e7e8';
            }
            for (const pid of pidsToColor) {
              const pidEl = <HTMLDivElement>pid;
              pidEl.style.backgroundColor = '#69ce2b';
            }
          }
        };
      })
      .catch((err) => {
        /* handle the error */
        console.error(err);
      });
  }

  /**
   * Toggle starting
   */
  async toggleStart(): Promise<void> {
    if (this.recordStarted) {
      this.stopRecording();
    } else {
      const permission = await navigator.permissions.query({
        name: 'microphone' as any
      });
      if (permission.state !== 'granted') {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((_stream) => {
          _stream.getTracks().forEach((track) => {
            track.stop();
          });
          navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => this.loadDevices(devices))
            .catch((err) => this.onErrorHandle('Device Capture', err));
        });
        return;
      }
      this.startRecording();
    }
  }

  /**
   * Toggle recording
   */
  toggleRecording(): void {
    if (this.recording) {
      this._mediaRecorder.pause();
      this._audioRecorder.pause();
      this.recording = false;
    } else {
      this._mediaRecorder.resume();
      this._audioRecorder.resume();
      this.recording = true;
    }
  }

  /**
   * Start recording
   */
  startRecording(): void {
    if (!this.microphone) {
      this.error = 'require_microphone';
      return;
    }
    if (this.recordStream) {
      this.closeMicStream();
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: { deviceId: { exact: this.microphone } },
        video: false
      })
      .then((stream) => {
        this.recordedTime = 0;
        this.recordStream = stream;
        this._mediaRecorder = new MediaRecorder(stream);
        this._waveSurfer = null;
        // _audioRecorder data would be uploaded. (_mediaRecorder data would be used for the displaying)
        const options = {
          mimeType: 'audio/wav',
          numberOfAudioChannels: 2
        };
        const StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
        this._audioRecorder = new StereoAudioRecorder(stream, options);
        this._audioRecorder.record();
        this._mediaRecorder.start(1000);
        this.recordStarted = true;
        this.recording = true;
        this._chunks = [];
        this.onRecordStart.emit();

        this.timer = interval(1000).subscribe(() => {
          this.recording && this.recordedTime++;
          this.leftSecond = this.convertTimeFormat(this.recordedTime);
          this.cdr.detectChanges();
          if (this.recordedTime >= 120) {
            this.stopRecording();
          }
        });

        this._mediaRecorder.ondataavailable = ({ data }) => {
          this._chunks.push(data);
          const blob = new Blob(this._chunks, { type: 'audio/wav' });
          this._waveSurfer && this._waveSurfer.loadBlob(blob);
        };

        setTimeout(() => {
          this._waveSurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: 'gray',
            progressColor: 'blue',
            barWidth: 4,
            barGap: 2,
            barRadius: 4,
            height: 50,
            interact: false
          });
        }, 1000);
      });
  }

  /**
   * Stop recording
   */
  stopRecording(status = true): void {
    if (!this._mediaRecorder) {
      return;
    }
    this._mediaRecorder.stop();
    this._audioRecorder.stop((blob) => {
      this.dataURL = URL.createObjectURL(blob);
      this.recordStarted = false;
      this.recording = false;
      this.onRecordStop.emit();
      this.timer.unsubscribe();
      this.microphone = '';
      this.closeMicStream();
      if (status) {
        this.onRecorded.emit({ file: blob, url: this.dataURL, content: '' });
      } else {
        this.dataURL = null;
      }
    });
  }

  /**
   * Close the microphone stream
   */
  closeMicStream(): void {
    if (this.measureStream) {
      this.measureStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (this.recordStream) {
      this.recordStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  /**
   * Close the measure stream
   */
  closeMeasureStream(): void {
    if (this.measureStream) {
      this.measureStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  /**
   * Download Video
   */
  download(): void {}

  /**
   * Clear the dataURL
   */
  remove(): void {
    this.dataURL = false;
    this.onRemoved.emit();
  }

  /**
   * Convert the seconds to mm:ss format
   * @param time: number of seconds
   * @returns: formatted result
   */
  convertTimeFormat(time: number): string {
    const totalSeconds = Math.floor(time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Voice speech recognization part //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////
  voiceActiveSectionDisabled = true;
  voiceActiveSectionError = false;
  voiceActiveSectionSuccess = false;
  voiceActiveSectionListening = false;
  voiceText: any;
  initializeVoiceRecognitionCallback(): void {
    annyang.addCallback('error', (err) => {
      if (err.error === 'network') {
        this.voiceText = 'Internet is require';
        annyang.abort();
        this.ngZone.run(() => (this.voiceActiveSectionSuccess = true));
      } else if (this.voiceText === undefined) {
        this.ngZone.run(() => (this.voiceActiveSectionError = true));
        annyang.abort();
      }
    });

    annyang.addCallback('soundstart', (res) => {
      this.ngZone.run(() => (this.voiceActiveSectionListening = true));
    });

    annyang.addCallback('end', () => {
      if (this.voiceText === undefined) {
        this.ngZone.run(() => (this.voiceActiveSectionError = true));
        annyang.abort();
      }
    });

    annyang.addCallback('result', (userSaid) => {
      console.log('userSaid', userSaid);
      this.ngZone.run(() => (this.voiceActiveSectionError = false));

      const queryText: any = userSaid[0];

      annyang.abort();

      this.voiceText = queryText;

      this.ngZone.run(() => (this.voiceActiveSectionListening = false));
      this.ngZone.run(() => (this.voiceActiveSectionSuccess = true));
    });
  }

  startVoiceRecognition(): void {
    this.voiceActiveSectionDisabled = false;
    this.voiceActiveSectionError = false;
    this.voiceActiveSectionSuccess = false;
    this.voiceText = undefined;

    if (annyang) {
      this.initializeVoiceRecognitionCallback();

      annyang.start({ autoRestart: false });
    }
  }

  closeVoiceRecognition(): void {
    this.voiceActiveSectionDisabled = true;
    this.voiceActiveSectionError = false;
    this.voiceActiveSectionSuccess = false;
    this.voiceActiveSectionListening = false;
    this.voiceText = undefined;

    if (annyang) {
      annyang.abort();
    }
  }
}

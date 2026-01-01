import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-[#1E1E1E] rounded-xl shadow-2xl w-full max-w-150 border border-white/10 overflow-hidden"
      >
        <div class="p-6 pb-2">
          <h2 class="text-2xl font-semibold text-white mb-2">
            Camera & Microphone Access Required
          </h2>
          <p class="text-gray-400 text-sm">
            To join the interview, you need to grant access to your camera and microphone.
          </p>
        </div>

        <div class="p-6 space-y-4">
          <div class="bg-[#272B30] rounded-lg p-5 border border-white/5">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-white font-medium text-lg">Permission Denied</h3>
              <a href="" target="_blank" class="text-[#8E6CFF] text-sm hover:underline"
                >Learn how to enable?</a
              >
            </div>

            <div class="space-y-3">
              <div class="flex items-center gap-3 text-gray-300">
                <div
                  class="w-8 h-8 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"
                >
                  <img src="Camera (3).svg" />
                </div>
                <span class="text-gray-400">Camera access is blocked.</span>
              </div>

              <div class="flex items-center gap-3 text-gray-300">
                <div
                  class="w-8 h-8 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"
                >
                  <img src="Icon button (3).svg" />
                </div>
                <span class="text-gray-400">Microphone access is blocked.</span>
              </div>
            </div>
          </div>

          <div class="bg-[#272B30] rounded-lg p-5 border border-white/5">
            <h3 class="text-white font-medium text-lg mb-4">How to Allow Permissions</h3>

            <div class="space-y-4">
              <div class="flex gap-4">
                <div
                  class="w-6 h-6 rounded-full bg-[#3D4045] flex items-center justify-center text-gray-300 text-sm font-medium shrink-0"
                >
                  1
                </div>
                <p class="text-gray-400 text-sm pt-0.5">
                  Look for a camera or lock icon in your browser's address bar
                </p>
              </div>

              <div class="flex gap-4">
                <div
                  class="w-6 h-6 rounded-full bg-[#3D4045] flex items-center justify-center text-gray-300 text-sm font-medium shrink-0"
                >
                  2
                </div>
                <p class="text-gray-400 text-sm pt-0.5">
                  Check your browser settings under Privacy & Security
                </p>
              </div>

              <div class="flex gap-4">
                <div
                  class="w-6 h-6 rounded-full bg-[#3D4045] flex items-center justify-center text-gray-300 text-sm font-medium shrink-0"
                >
                  3
                </div>
                <p class="text-gray-400 text-sm pt-0.5">
                  You may need to reload the page after granting permissions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Popupcomponent {
  @Input() visible = false;
}

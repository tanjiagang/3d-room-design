import { throttle } from 'lodash-es';

declare global {
  interface HTMLElement {
    _lazyloadObserver?: IntersectionObserver;
    _lastSrc?: string;
  }
}

const LazyLoad = {
  mounted(el: HTMLElement, binding: any) {
    initObserver(el, binding.value)
  },
  updated(el: HTMLElement, binding: any) {
    if (el._lastSrc !== binding.value) {
      el._lazyloadObserver?.disconnect();
      initObserver(el, binding.value);
    }
  },
  unmounted(el: any) {
    if (el._lazyloadObserver) {
      el._lazyloadObserver.disconnect();
    }
  }
};

function initObserver(el: HTMLElement, src: string) {
  el._lastSrc = src;
  el.setAttribute('data-src', src);
  el.setAttribute('src', ''); // 清空初始src
    
    const observer = new IntersectionObserver(
      throttle((entries) => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src ||  '';
              observer.unobserve(img);
            }
          }
        });
      }, 300),
      { rootMargin: '200px 0px' } // 提前200px触发加载
    );
    
    observer.observe(el);
    el._lazyloadObserver = observer;
}

export { LazyLoad };

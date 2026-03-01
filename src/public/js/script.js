(function ($) {
  "use strict";

  var searchPopup = function () {
    // open search box
    $("#header-nav").on("click", ".search-button", function (e) {
      $(".search-popup").toggleClass("is-visible");
    });

    $("#header-nav").on("click", ".btn-close-search", function (e) {
      $(".search-popup").toggleClass("is-visible");
    });

    $(".search-popup-trigger").on("click", function (b) {
      b.preventDefault();
      $(".search-popup").addClass("is-visible");
      setTimeout(function () {
        $(".search-popup").find("#search-popup").focus();
      }, 350);
    });

    $(".search-popup").on("click", function (b) {
      if ($(b.target).closest(".search-popup-close").length || $(b.target).is(".search-popup")) {
        b.preventDefault();
        $(this).removeClass("is-visible");
      }
    });

    $(document).keyup(function (b) {
      if (b.which === 27) {
        $(".search-popup").removeClass("is-visible");
      }
    });
  };

  var initProductQty = function () {
    $(".product-qty").each(function () {
      var $el_product = $(this);

      $el_product.find(".quantity-right-plus").click(function (e) {
        e.preventDefault();
        var quantity = parseInt($el_product.find("#quantity").val(), 10) || 0;
        $el_product.find("#quantity").val(quantity + 1);
      });

      $el_product.find(".quantity-left-minus").click(function (e) {
        e.preventDefault();
        var quantity = parseInt($el_product.find("#quantity").val(), 10) || 0;
        if (quantity > 0) {
          $el_product.find("#quantity").val(quantity - 1);
        }
      });
    });
  };

  var initSliders = function () {
    if (typeof Swiper === "undefined") return;

    var mainSwiper = new Swiper(".main-swiper", {
      speed: 500,
      navigation: {
        nextEl: ".swiper-arrow-prev",
        prevEl: ".swiper-arrow-next",
      },
    });

    var testimonialSwiper = new Swiper(".testimonial-swiper", {
      loop: true,
      navigation: {
        nextEl: ".swiper-arrow-prev",
        prevEl: ".swiper-arrow-next",
      },
    });

    var productGridConfig = {
      slidesPerView: 5,
      spaceBetween: 10,
      breakpoints: {
        0: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
        1200: {
          slidesPerView: 5,
          spaceBetween: 20,
        },
      },
    };

    var productSwiper = new Swiper(
      ".product-swiper",
      $.extend(true, {}, productGridConfig, {
        pagination: {
          el: "#mobile-products .swiper-pagination",
          clickable: true,
        },
      })
    );

    var productWatchSwiper = new Swiper(
      ".product-watch-swiper",
      $.extend(true, {}, productGridConfig, {
        pagination: {
          el: "#smart-watches .swiper-pagination",
          clickable: true,
        },
      })
    );
  };

  $(document).ready(function () {
    searchPopup();
    initProductQty();

    const searchModal = document.getElementById("searchModal");
    const searchInput = document.getElementById("searchInput");
    if (searchModal && searchInput) {
      searchModal.addEventListener("shown.bs.modal", () => searchInput.focus());
    }

    initSliders();
  });
})(jQuery);

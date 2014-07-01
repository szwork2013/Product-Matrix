four51.app.factory('ProductMatrix', ['$resource', '$451', 'Variant', function($resource, $451, Variant) {
    function _then(fn, data, count) {
        if (angular.isFunction(fn))
            fn(data, count);
    }

    var _build = function(product, order, success) {
        var specCombos = {};
        angular.forEach(product.Specs, function(spec) {
            if (spec.ListOrder == 1) {
                angular.forEach(product.Specs, function(s) {
                    if (s.ListOrder == 2) {
                        angular.forEach(spec.Options, function(option) {
                            specCombos[option.Value] = [];
                            angular.forEach(s.Options, function(o) {
                                var combo = [option.ID, o.ID];
                                combo.Markup = option.Markup + o.Markup;
                                combo.Specs = {};
                                combo.Specs[spec.Name] = spec;
                                combo.Specs[s.Name] = s;
                                specCombos[option.Value].push(combo);
                            });
                        });
                    }
                });
            }
        });

        var comboVariants = {};
        var comboCount = 0;
        var variantCount = 0;
        for (var option in specCombos) {
            comboVariants[option] = [];
            angular.forEach(specCombos[option], function(combo) {
                comboCount++;
                getVariantData(product, combo, option);
            });
        }

        function countVariantInOrder(variant) {
            var count = 0;
            angular.forEach(order.LineItems, function(item) {
                if (item.Variant && item.Variant.ExternalID == variant.ExternalID) {
                    count = count + item.Quantity;
                }
            });
            return count;
        }

        function getVariantData(p, params, group) {
            Variant.get({'ProductInteropID': p.InteropID, 'SpecOptionIDs': params}, function(variant){
                variant.DisplayName = [];
                variant.Markup = params.Markup;
                variant.tempSpecs = {};
                angular.forEach(product.Specs, function(spec) {
                    angular.forEach(spec.Options, function(option) {
                        if (option.ID == params[0]) {
                            variant.tempSpecs[spec.Name] = {};
                            variant.tempSpecs[spec.Name].Value = option.Value;
                            variant.DisplayName[0] = option.Value;
                        }
                        if (option.ID == params[1]) {
                            variant.tempSpecs[spec.Name] = {};
                            variant.tempSpecs[spec.Name].Value = option.Value;
                            variant.DisplayName[1] = option.Value;
                        }
                    });
                });
                variant.OrderQuantity = order ? countVariantInOrder(variant) : 0;
                comboVariants[group].DisplayName = group;
                variantCount++;
                comboVariants[group].push(variant);
                if (variantCount == comboCount) {
                    _then(success, comboVariants);
                }
            });
        }
    }

    var _validateQty = function(matrix, product, success) {
        var qtyError = "";
        var priceSchedule = product.StandardPriceSchedule;
        angular.forEach(matrix, function(group) {
            angular.forEach(group, function(variant) {
                var qty = variant.Quantity;
                if (variant.Quantity) {
                    if(!$451.isPositiveInteger(qty))
                    {
                        qtyError += "<p>Please select a valid quantity for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";
                    }
                }
                if(priceSchedule.MinQuantity > qty && qty != 0){
                    qtyError += "<p>Quantity must be equal or greater than " + priceSchedule.MinQuantity + " for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";
                }
                if(priceSchedule.MaxQuantity && priceSchedule.MaxQuantity < qty){
                    qtyError += "<p>Quantity must be equal or less than " + priceSchedule.MaxQuantity + " for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";
                }
                var qtyAvail = variant.QuantityAvailable;
                if(qtyAvail < qty && product.AllowExceedInventory == false){
                    qtyError = "<p>Quantity cannot exceed the Quantity Available of " +  qtyAvail + " for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";;
                }
            });
        });

        _then(success, qtyError);
    }

    var _addToOrder = function(matrix, product, success) {
        var lineItems = [];
        angular.forEach(matrix, function(group) {
            angular.forEach(group, function(item) {
                if (item.Quantity > 0) {
                    var liSpecs = {};
                    for (var spec in product.Specs) {
                        liSpecs[spec] = angular.copy(product.Specs[spec]);
                        liSpecs[spec].Value = item.tempSpecs[spec].Value;
                    }
                    var li = {
                        "PriceSchedule":product.StandardPriceSchedule,
                        "Product":product,
                        "Quantity":item.Quantity,
                        "Specs":liSpecs,
                        "Variant":item,
                        "qtyError":null
                    }
                    lineItems.push(li);
                }
            });
        });
        _then(success, lineItems);
    }

    return {
        build: _build,
        validateQuantity: _validateQty,
        addToOrder: _addToOrder
    }
}]);

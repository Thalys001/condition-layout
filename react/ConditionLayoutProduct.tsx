import React, { useMemo } from 'react'
import { useProduct } from 'vtex.product-context'
import type { Product, Item } from 'vtex.product-context/react/ProductTypes'

import ConditionLayout from './ConditionLayout'
import type { NoUndefinedField, MatchType, Condition, Handlers } from './types'

type Props = {
  conditions: Array<Condition<ContextValues, HandlerArguments>>
  matchType?: MatchType
  Else?: React.ComponentType
  Then?: React.ComponentType
}

type ContextValues = {
  productId: Product['productId']
  categoryId: Product['categoryId']
  brandId: Product['brandId']
  productClusters: Product['productClusters']
  clusterHighlights: Product['clusterHighlights']
  categoryTree: Product['categoryTree']
  selectedItemId: Item['itemId']
  specificationProperties: Product['properties']
  areAllVariationsSelected: boolean
  sellers: Item['sellers']
}

type HandlerArguments = {
  productId: { id: string }
  categoryId: { id: string }
  brandId: { id: string }
  productClusters: { id: string }
  productClusterHighlights: { id: string }
  categoryTree: { id: string }
  selectedItemId: { id: string }
  specificationProperties: { name: string; value?: string }
  areAllVariationsSelected: undefined
  isProductAvailable: undefined
  hasMoreSellersThan: { quantity: number }
  hasBestPrice: { value: boolean } | undefined
  sellerId: { ids: string[] }
}

export const HANDLERS: Handlers<ContextValues, HandlerArguments> = {
  productId({ values, args }) {
    return String(values.productId) === String(args?.id)
  },
  categoryId({ values, args }) {
    return String(values.categoryId) === String(args?.id)
  },
  brandId({ values, args }) {
    return String(values.brandId) === String(args?.id)
  },
  selectedItemId({ values, args }) {
    return String(values.selectedItemId) === String(args?.id)
  },
  areAllVariationsSelected({ values }) {
    return values.areAllVariationsSelected
  },
  productClusters({ values, args }) {
    return Boolean(
      values.productClusters?.find(({ id }) => String(id) === String(args?.id))
    )
  },
  productClusterHighlights({ values, args }) {
    return values.clusterHighlights?.some(
      ({ id }) => String(id) === String(args?.id)
    )
  },
  categoryTree({ values, args }) {
    return Boolean(
      values?.categoryTree?.find(({ id }) => String(id) === String(args?.id))
    )
  },
  specificationProperties({ values, args }) {
    const specification = values.specificationProperties?.find(
      ({ name }) => name === args?.name
    )

    if (specification == null) return false
    if (args?.value == null) return Boolean(specification)

    return specification.values.includes(String(args?.value))
  },
  isProductAvailable({ values }) {
    const { sellers } = values

    const isAvailable = sellers?.some(
      (seller) => seller.commertialOffer.AvailableQuantity > 0
    )

    return Boolean(isAvailable)
  },
  hasMoreSellersThan({ values, args }) {
    const { sellers } = values

    const productAvailable = sellers?.filter(
      (seller) => seller.commertialOffer.AvailableQuantity > 0
    )

    const isMoreThan = productAvailable?.length > args?.quantity

    return isMoreThan
  },
  hasBestPrice({ values, args }) {
    const {
      commertialOffer: { ListPrice, Price },
    } =
      values.sellers?.find(({ sellerDefault }) => sellerDefault) ??
      // Falls back to first seller, if no default is found.
      values.sellers[0]

    const expected = args?.value ?? true
    const hasDiscount = ListPrice !== Price

    return hasDiscount === expected
  },
  sellerId({ values, args }) {
    const { sellers } = values

    const availableSellers = sellers?.filter(
      (seller) => seller.commertialOffer.AvailableQuantity > 0
    )

    const matchSellers = availableSellers?.some((availableSeller) =>
      args?.ids?.includes(availableSeller.sellerId)
    )

    return matchSellers
  },
}

const ConditionLayoutProduct: StorefrontFunctionComponent<Props> = ({
  Else,
  Then,
  matchType,
  conditions,
  children,
}) => {
  const {
    product,
    selectedItem,
    skuSelector: { areAllVariationsSelected = false } = {},
  } = useProduct() ?? {}

  const {
    productId,
    categoryId,
    brandId,
    productClusters,
    clusterHighlights,
    categoryTree,
    properties: specificationProperties,
  } = product ?? {}

  const { itemId: selectedItemId, sellers } = selectedItem ?? {}

  // We use a useMemo to modify the condition layout "values"
  // only when some of the context props change.
  const values = useMemo<ContextValues>(() => {
    const bag = {
      productId,
      categoryId,
      brandId,
      productClusters,
      clusterHighlights,
      categoryTree,
      selectedItemId,
      specificationProperties,
      areAllVariationsSelected,
      sellers,
    }

    // We use `NoUndefinedField` to remove optionality + undefined values from the type
    return bag as NoUndefinedField<typeof bag>
  }, [
    brandId,
    categoryId,
    categoryTree,
    productClusters,
    clusterHighlights,
    productId,
    selectedItemId,
    specificationProperties,
    areAllVariationsSelected,
    sellers,
  ])

  // Sometimes it takes a while for useProduct() to return the correct results
  if (values.selectedItemId == null || values.productId == null) {
    return null
  }

  return (
    <ConditionLayout
      Else={Else}
      Then={Then}
      matchType={matchType}
      conditions={conditions}
      values={values}
      handlers={HANDLERS}
    >
      {children}
    </ConditionLayout>
  )
}

ConditionLayoutProduct.schema = {
  title: 'admin/editor.condition-layout.wrapper.product',
}

export default ConditionLayoutProduct
